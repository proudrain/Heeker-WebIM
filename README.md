# HEEKER (Web IM)

## 功能简介
+ 注册登录。(注册提供邀请码机制)
+ 添加好友。
+ 在线聊天。
+ 离线消息。

## 技术实现
+ 前端使用**Angularjs**框架。
+ 后端使用python的**tornado**框架。
+ 核心通信使用**WebSocket**。

## 依赖
+ python-3.4
+ tornado-4.1
+ pymysql-0.6.3

## Tips
+ `python/main_service.py`为后端主程序。
+ 数据库只需要执行该`sql/heeker.sql` SQL语句即可导入全部测试用数据。
+ 可通过`python/invite_keys.py`查看现有邀请码。


## 待处理BUG
1. ~~点击添加好友后自动发送请求（请求好友列表），并且会话按钮变成激活状态。~~
   > 原因是`href='#'`的`<a></a>`所致。

2. ~~只能通过注销登陆安全退出，否则后台无法消除在线记录。~~
   > ~~需要通过离开页面的事件触发（`directive`）。~~
   > 页面跳转或直接关闭的时候，服务端未做下线处理。

3. ~~Angular 路由切换时，`Service`中的数据未重置。~~

4. 注销登陆按钮点击后多余弹窗，

5. ~~消息过长时，消息框与头像错位。~~
   > *message指令* 内部动态确定`max-length`值。

6. 注册处验证重复输入密码的指令。

7. 当用户在服务器处于离线的状态并通过请求得到反馈时，弹窗内容应改变。

8. Firefox 使用回车键发送消息后会出现“请填写该字段”的提示。

9. ~~聊天窗口滚动条没有一直保持在底部。~~


## 不足与待更新
### 技术层面
1. 部分代码实现应该改成Angular的实现。
 + Bootstrap的js组件。

2. 部分Angular的实现应该有更好的方式，可能需要重构部分代码。
 + `controller`与`service`中的数据保持一致都依赖于引用类型。像`currChat`处的实现显得很累赘很不优雅。

3. `APIService`与`OnlineService`的相互依赖。

4. ~~后端用户在线列表和socket列表分属两个列表。~~
 + 能否简化？已改为一个大字典，同时也优化了检索效率。

5. ~~为了提高性能是否应该把上述列表改为字典。~~
 + 哈希算法获取相应`value`以避免频繁遍历？如上。

6. 整体API的设置不太符合REST概念。
 + 例如把登入登出还有注册都改为对一个USER资源的请求，统一使用一个`Handler`，通过不同的请求以及参数来辨别具体操作。

7. 邀请码在数据库实现上可以写一个触发器，每当消耗一个自动生成一个。

8. 由于之前没有过自动化测试的经验并且时间比较紧，前端Angularjs的测试部分没有做。

### 功能层面
1. 新消息提示。
2. 美化滚动条。
3. 还原会话以及消息记录。
4. 添加用户自己的头像栏，并提供个人信息设置。
5. 密码格式验证。
6. 文件传输。
7. 表情。
8. 添加好友提供验证。
9. 删除好友。
10. 记住我。
