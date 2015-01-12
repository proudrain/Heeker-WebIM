import tornado.httpserver
import tornado.ioloop
import tornado.options
import tornado.web
import tornado.websocket
import tornado.escape
import pymysql
import hashlib
import random

from tornado.options import define, options
from tornado.escape import json_encode, json_decode
from cors import CorsHandler
from dbop import conn_db, close_db, query_db, update_db

define("port", default=8000, help="run on the given port", type=int)

class StatusInfo:
    """状态信息类"""
    def __init__(self, stat='wrong', info=''):
        self.status = {'status': {stat: info}}
    def get_str(self):
        return json_encode(self.status)

class OnlineRecord:
    """在线用户记录

    记录在线用户的核心信息和相应的websocket实例。
    提供相应的方法操作
    """

    def __init__(self):
        self.__record = {};

    def add_user(self, user):
        try:
            if self.is_online(user['heekid']):
                raise Exception('This user was already in records!')
            self.__record[user['heekid']] = {'info': user, 'socket': None}
        except Exception as e:
            print('Record Error (add error):', e)

    def del_user(self, heekid):
        try:
            if self.__record[heekid]['socket']:
                self.__record[heekid]['socket'].close()
            del self.__record[heekid]
        except KeyError as e:
            print('Record Error (delete error):', e)

    def get_userinfo(self, heekid):
        try:
            return self.__record[heekid]['info']
        except KeyError as e:
            print('Record Error (get info error):', e)

    def set_socket(self, heekid, socket):
        try:
            if not self.__record.get(heekid):
                raise Exception('This user not online!')
            self.__record[heekid]['socket'] = socket
        except Exception as e:
            print('Record Error (set socket error):', e)

    def get_socket(self, heekid):
        try:
            return self.__record[heekid]['socket']
        except KeyError as e:
            print('Record Error (get socket error):', e)

    def is_online(self, heekid, rand=None):
        if self.__record.get(heekid):
            if not rand:
                return True
            if rand == self.get_userinfo(heekid)['rand']:
                return True
        return False

    def get_whole_record(self):
        return self.__record

def construct_user(heekid, rand):
    """构造用户字典"""
    return {'heekid': heekid, 'rand': rand}

def add_content(status, content):
    """构造内容字典"""
    status['content'] = content
    return status

# 获取好友列表sql语句
def sql_addrs(heekid):
    return "SELECT HEEKID FROM users WHERE exists \
            (SELECT * FROM addrs WHERE addrs.GUEST=users.ID AND exists \
            (SELECT * FROM users WHERE addrs.HOST=users.ID AND \
            users.HEEKID='" + heekid + "'))"

# 实例化一个在线记录对象
record = OnlineRecord()

class SignupHandler(CorsHandler):
    def post(self):
        new_heekid = self.get_argument("new_heekid")
        new_passwd = self.get_argument("new_passwd")
        invitation = self.get_argument("invitation")
        conn, cur = conn_db()
        stat = ''
        cur.callproc('add_user', (new_heekid, hashlib.md5(new_passwd.encode('utf8')).hexdigest(), invitation, stat))
        cur.execute('SELECT @_add_user_3')
        stat = cur.fetchone()['@_add_user_3']
        if stat == 'invalid invitation':
            self.write(StatusInfo(info='invalid invitation').status)
        if stat == 'repeated heekid':
            self.write(StatusInfo(info='repeated heekid').status)
        if stat == 'ok':
            self.write(StatusInfo(stat='ok').status)
        close_db(conn, cur)

class LoginHandler(CorsHandler):
    def post(self):
        heekid = self.get_argument("heekid")
        password = self.get_argument("password")
        
        conn, cur = conn_db()
        sql = "select PASSWORD from users where HEEKID='" + heekid + "'"
        query_db(cur, sql)
        if cur.rowcount != 0 and cur.fetchone()['PASSWORD'] == hashlib.md5((password).encode('utf8')).hexdigest():

            # 判断是否已经登陆，若已登陆，将其踢出队列，此处重新登陆
            if record.is_online(heekid):
                record.del_user(heekid)

            user = construct_user(heekid, str(random.randint(1000, 9999)))
            record.add_user(user)
            status = StatusInfo(stat='ok').status
            self.write(add_content(status, user))
            print(record.get_whole_record())
        else:
            self.write(StatusInfo(info='id or passwd error').status)
        close_db(conn, cur)

class LogoutHandler(CorsHandler):
    def post(self):
        heekid = self.get_argument("heekid")
        rand = self.get_argument("rand")
        if record.is_online(heekid, rand):
            record.del_user(heekid)
            self.write(StatusInfo(stat='ok').status)
            print(record.get_whole_record())
        else:
            self.write(StatusInfo(info='offline').status)

class AddrListHandler(CorsHandler):
    def get(self):
        heekid = self.get_argument("heekid")
        rand = self.get_argument("rand")
        if record.is_online(heekid, rand):
            conn, cur = conn_db()
            sql = sql_addrs(heekid)
            query_db(cur, sql)
            addr = []
            for row in cur:
                addr.append({ "heekid": row['HEEKID'] })
            close_db(conn, cur)

            status = StatusInfo(stat='ok').status
            self.write(add_content(status, addr))
        else:
            self.write(StatusInfo(info='offline').status)

    def put(self):
        print('got put')
        heekid = self.get_argument("heekid")
        rand = self.get_argument("rand")
        add_heekid = self.get_argument("add_heekid")
        if record.is_online(heekid, rand):
            conn, cur = conn_db();
            stat = ''
            cur.callproc('update_addrs', (heekid, add_heekid, stat))
            cur.execute('SELECT @_update_addrs_2')
            stat = cur.fetchone()['@_update_addrs_2']
            print(stat)
            if stat == 'not found':
                self.write(StatusInfo(info='not found').status)
            if stat == 'repeated':
                self.write(StatusInfo(info='repeated').status)
            if stat == 'ok':
                addr = []
                sql = sql_addrs(heekid)
                query_db(cur, sql)
                for row in cur:
                    addr.append({ "heekid": row['HEEKID'] })
                status = StatusInfo(stat='ok').status
                self.write(add_content(status, addr))
                # 若被加方在线，通知其更新好友列表
                if record.is_online(add_heekid) and record.get_socket(add_heekid):
                    socket = record.get_socket(add_heekid)
                    socket.write_message({'update': 'addr'})

            close_db(conn, cur)
        else:
            self.write(StatusInfo(info='offline').status)

class ChatHandler(tornado.websocket.WebSocketHandler):
    def check_origin(self, origin):
        if origin != "http://localhost:8080":
            return False
        return True

    def open(self):
        print('opened')

    def on_message(self, message):
        message = json_decode(message)
        
        # 身份验证
        if message.get('identity'):
            identity = message['identity']
            if not record.is_online(**identity):
                self.close()
                return
            record.set_socket(identity['heekid'], self)

            # 获取发送至该用户的离线消息
            conn, cur = conn_db()
            cur.callproc('get_message', (identity['heekid'],))
            for msg in cur:
                chat = {'from': msg['FROM_'], 'to': msg['TO_'], 
                        'content': msg['CONTENT'], 'date': msg['DATE']}
                self.write_message({'chat': chat})
            close_db(conn, cur)

        if message.get('chat'):
            chat = message['chat']
            if not record.is_online(chat['from']) or not record.get_socket(chat['from']):
                self.close()
                return
            # 转发消息
            if record.is_online(chat['to']):
                print('online')
                socket = record.get_socket(chat['to'])
                socket.write_message({'chat': chat})
            else:
                conn, cur = conn_db()
                cur.callproc('msg_record', (chat['from'], chat['to'], chat['content'], int(chat['date'])))
                close_db(conn, cur)

    def on_close(self):
        print('closed')


class Application(tornado.web.Application):
    def __init__(self):
        handlers = [
            (r"/api/signup", SignupHandler),
            (r"/api/login", LoginHandler),
            (r"/api/logout", LogoutHandler),
            (r"/api/addr_list", AddrListHandler),
            (r"/api/ws_chat", ChatHandler),
        ]
        tornado.web.Application.__init__(self, handlers)

if __name__ == "__main__":
    tornado.options.parse_command_line()
    http_server = tornado.httpserver.HTTPServer(Application())
    http_server.listen(options.port)
    tornado.ioloop.IOLoop.instance().start()
