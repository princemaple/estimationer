from tornado.ioloop import IOLoop
from tornado.web import RequestHandler, Application, StaticFileHandler, url
from tornado.websocket import WebSocketHandler

import os


settings = {
    'debug': os.getenv('DEBUG', None) == 'TRUE',
    'template_path': 'templates',
    'static_path': 'statics'
}

connections = []
estimations = []


class AppHandler(RequestHandler):
    def get(self):
        self.render('index.html')


class Estimation(WebSocketHandler):
    def open(self):
        if not connections:
            self.write_message('ADMIN')

        connections.append(self)
        self.write_message('hello')

    def on_message(self, message):
        global estimations

        if message.startswith('EST:'):
            estimations.append(int(message[4:]))
            estimators = len(estimations)
            average = sum(estimations) / float(estimators)
            for conn in connections:
                conn.write_message('AEST:{}:{}'.format(average, estimators))

        if message.startswith('NEW:'):
            estimations = []
            for conn in connections:
                conn.write_message(message)
                conn.write_message('AEST:{}:{}'.format(0, 0))

    def on_close(self):
        connections.remove(self)


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


main()
