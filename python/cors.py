"""CORS_handler"""

import tornado.web

class CorsHandler(tornado.web.RequestHandler):
    def prepare(self):
        self.add_header("Access-Control-Allow-Origin", "*")

    def options(self):
        self.add_header("Access-Control-Allow-Methods", "GET, POST, PUT")
        self.add_header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
        self.add_header("Access-Control-Max-Age", 60)

# def jsonp_constructor(request, data):
#     """Constructing jsonp string"""
#     callback = request.get_argument("callback")
#     if isinstance(data, dict) or isinstance(data, list):
#         data = escape.json_encode(data)
#     return callback + '(' + data + ')'
