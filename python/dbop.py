"""DATABASE operations"""

import pymysql

def conn_db(host_='localhost', user_='smsphp', passwd_='smsphp123', db_='heeker', port_=3306, charset_='utf8'):
    """连接数据库"""
    try:
        conn = pymysql.connect(host=host_, user=user_, passwd=passwd_, db=db_, port=port_, charset=charset_)
        cur = conn.cursor(pymysql.cursors.DictCursor)
        return (conn, cur)
    except Exception: print("发生异常")

def close_db(conn, cur):
    """关闭所有连接"""
    cur.close()
    conn.close()

def query_db(cur, sql):
    """数据查询"""
    cur.execute(sql)
    return cur

def update_db(cur, sql):
    """数据更新"""
    status = cur.execute(sql)
    return status

def delete_db(cur, sql):
    """数据删除"""
    status = cur.execute(sql)
    return status
