from __future__ import division

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

connections = []
estimations = []


def debug_messaging(f):
    if not DEBUG: return f

    def on_message(self, message):
        print("User#{}-{}:{}".format(
            connections.index(self),
            getattr(self, 'name', '()'),
            message
        ))
        f(self, message)

    return on_message


class AppHandler(RequestHandler):
    def get(self):
        self.render('index.html')


class Estimation(WebSocketHandler):
    def open(self):
        if not connections:
            self.write_message('ADMIN')

        connections.append(self)
        self.write_message('hello')

    @debug_messaging
    def on_message(self, message):
        global estimations

        if message.startswith('IAM:'):
            self.name = message[4:]

        elif message.startswith('EST:'):
            estimation = int(message[4:])
            estimations.append(estimation)
            estimators = len(estimations)
            average = sum(estimations) / estimators
            for conn in connections:
                conn.write_message('EST:{}:{}'.format(self.name, estimation))
                conn.write_message('AEST:{}:{}'.format(average, estimators))

        elif message.startswith('NEW:'):
            if self is not connections[0]: return

            estimations = []
            for conn in connections:
                conn.write_message(message)
                conn.write_message('AEST:{}:{}'.format(0, 0))

        elif message == 'PING':
            self.write_message('PONG');

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
