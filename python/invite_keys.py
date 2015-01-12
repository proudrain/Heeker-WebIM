"""Show Invite Keys"""

import pymysql
from dbop import conn_db, close_db, query_db, update_db

def get_invitation():
    keys = []
    conn, cur = conn_db()
    sql = "SELECT INVITE_KEY FROM invitations"
    query_db(cur, sql)
    for row in cur:
        keys.append(row['INVITE_KEY'])
    close_db(conn, cur)
    return keys

if __name__ == '__main__':
    print(get_invitation())
