from tornado.ioloop import IOLoop
from tornado.web import RequestHandler, Application, StaticFileHandler, url
from tornado.websocket import WebSocketHandler

import os


DEBUG = os.getenv('DEBUG', None) == 'TRUE'

settings = {
    'debug': DEBUG,
    'template_path': 'templates',
    'static_path': 'statics'
}


def debug_messaging(f):
    if not DEBUG: return f

    def on_message(self, message):
        print("User#{}-{}:{}".format(
            Estimationer.connections.index(self),
            getattr(self, 'name', '()'),
            message
        ))
        f(self, message)

    return on_message


class Dispatcher:
    ROUTES = {
        'EST': 'estimate',
        'IAM': 'new_user',
        'PING': 'ping',
        'NEW': 'new_issue'
    }

    @classmethod
    def dispatch(cls, conn, message):
        command, *args = message.split(':')

        if command not in cls.ROUTES: return

        getattr(Estimationer, cls.ROUTES[command])(conn, *args)


class Estimationer:
    connections = []
    estimations = []

    @classmethod
    def new_user(cls, conn, who):
        conn.name = who

        if conn is not cls.connections[0]:
            cls.connections[0].write_message('YO:{}'.format(who))

    @staticmethod
    def ping(conn):
        conn.write_message('PONG')

    @classmethod
    def estimate(cls, conn, score):
        estimation = int(score)
        cls.estimations.append(estimation)

        estimators = len(cls.estimations)
        average = sum(cls.estimations) / estimators

        for c in cls.connections:
            c.write_message('EST:{}:{}'.format(conn.name, estimation))
            c.write_message('AVG:{:.1f}:{}'.format(average, estimators))

    @classmethod
    def new_issue(cls, conn, issue):
        if conn is not cls.connections[0]: return

        cls.estimations = []
        for c in cls.connections:
            c.write_message('NEW:{}'.format(issue))
            c.write_message('AVG:{}:{}'.format(0, 0))


class AppHandler(RequestHandler):
    def get(self):
        self.render('index.html')


class Estimation(WebSocketHandler):
    def open(self):
        if not Estimationer.connections:
            self.write_message('ADMIN')

        Estimationer.connections.append(self)

    @debug_messaging
    def on_message(self, message):
        Dispatcher.dispatch(self, message)

    def on_close(self):
        if self is not Estimationer.connections[0]:
            Estimationer.connections[0].write_message('BYE:{}'.format(self.name))
        Estimationer.connections.remove(self)


def make_app():
    return Application([
        url(r'^/$', AppHandler),
        url(r'^/websocket$', Estimation),
        url(r'^/static/(.+)$', StaticFileHandler)
    ], **settings)


def main():
    app = make_app()
    app.listen(os.getenv('PORT', 8888))
    IOLoop.current().start()


if __name__ == '__main__':
    main()
