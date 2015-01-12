var heekerServices = angular.module('heekerServices', ['ngResource']);

heekerServices.factory('APIService', ['$resource', 'OnlineService',
    function($resource, OnlineService) {
        return $resource("http://localhost:8000/api/:do", OnlineService.user, {
            post: {
                method: 'POST',
                transformRequest: function(obj) {
                    var str = [];
                    for (var p in obj)
                        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                    return str.join("&");
                }
            },
            update: {
                method: 'PUT',
                transformRequest: function(obj) {
                    var str = [];
                    for (var p in obj)
                        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                    return str.join("&");
                }
            },
        });
    }
]);

heekerServices.factory('OnlineService', ['$resource', 'WindowService', 'ChatingService',
    function($resource, WindowService, ChatingService) {
        var OnlineService = {};

        OnlineService.user = { "heekid": "", "rand": "" };
        OnlineService.addr_list = [];
        OnlineService.init = function(id, rd) {
            this.user.heekid = id;
            this.user.rand = rd;
            this.addr_list.length = 0;
        };
        OnlineService.get_id = function() {
            return this.user.heekid;
        };
        OnlineService.isOnline = function() {
            if (this.get_id() != '') 
                return true;
            return false;
        };
        OnlineService.reset = function() {
            OnlineService.user.heekid = '';
            OnlineService.user.rand = '';
            OnlineService.addr_list.length = 0;
        };

        OnlineService.logoutReset = function(flag) {
            switch(flag) {
                case 'request':
                    if (!OnlineService.isOnline()) {
                        return;
                    }
                    // 为避免circular dependency，此处没办法使用APIService
                    $resource("http://localhost:8000/api/:do", OnlineService.user, {})
                    .save({do: 'logout'}, {}, function(data) {
                        if ('ok' in data.status || data.status.wrong == 'offline') {
                            OnlineService.reset();
                            ChatingService.reset();
                            WindowService.reset();
                        }
                    });
                    break;
                case 'info':
                    OnlineService.reset();
                    ChatingService.reset();
                    WindowService.reset();
                    break;
            }
        };

        return OnlineService;
    }
]);

heekerServices.factory('WindowService', [
    function() {
        var WindowState = { "state": { "chat": true, "addr": false, "chatWin": false } };
        WindowState.chatDisplay = function() {
            WindowState.state.chat = true;
            WindowState.state.addr = false;
        }
        WindowState.addrDisplay = function() {
            WindowState.state.chat = false;
            WindowState.state.addr = true;
        }
        WindowState.chatWinDisplay = function() {
            WindowState.state.chatWin = true;
        }
        WindowState.chatWinClose = function() {
            WindowState.state.chatWin = false;
        }
        WindowState.reset = function() {
            WindowState.state.chat = true;
            WindowState.state.addr = false;
            WindowState.state.chatWin = false;
        }

        return WindowState;
    }
]);

heekerServices.factory('ChatingService', [
    function() {
        var chatList = [];
        var ChatService = {};
        var index;
        
        ChatService.list = chatList;
        ChatService.chatNum = chatList.length;
        ChatService.currChat = [];

        ChatService.addChat = function(heekid, active, message, tosend) {
            var notexist = true;
            for (var i=0; i < chatList.length; i++) {
                if (chatList[i].heekid == heekid) {
                    notexist = false;
                    break;
                }
            }
            if (notexist) {
                var chat = {
                    "heekid": heekid,
                    "msg_list": message ? message : [],
                    "tosend": tosend ? tosend : "",
                    "active": active? Boolean(active) : false
                }
                chatList.push(chat);
                ChatService.chatNum++;
            }
        };

        ChatService.deleteChat = function(chat) {
            for (var i=0; i < chatList.length; i++) {
                if (chatList[i].heekid == chat.heekid) {
                    chatList[i].active = false;
                    ChatService.currChat.pop();
                    chatList.splice(i, 1);
                    ChatService.chatNum--;
                    break;
                }
            }
        };

        ChatService.setActive = function(heekid) {
            for (var i=0; i < chatList.length; i++) {
                if (chatList[i].heekid == heekid) {
                    chatList[i].active = true;
                    ChatService.currChat.pop();
                    ChatService.currChat.push(chatList[i]);
                } else {
                    chatList[i].active = false;
                }
            }
        };

        ChatService.addMessage = function(heekid, message) {
            for (var i=0; i < chatList.length; i++) {
                if (chatList[i].heekid == heekid) {
                    chatList[i].msg_list.push(message);
                    break;
                }
            } 
        };

        ChatService.reset = function() {
            chatList.length = 0;
            ChatService.chatNum = chatList.length;
            ChatService.currChat = [];
        };
        
        return ChatService;
    }
]);

heekerServices.factory('SocketService', ['$rootScope', 'ChatingService', 'OnlineService', 'APIService',
    function($rootScopt, ChatingService, OnlineService, APIService) {
        var Service = {};
        var ws = {};

        Service.conn = function() {
            ws = new WebSocket("ws://localhost:8000/api/ws_chat");
            ws.onopen = function() {
                var confirm_info = { "identity": OnlineService.user }
                ws.send(JSON.stringify(confirm_info));
            };
            ws.onmessage = function(msg) {
                message = JSON.parse(msg.data);
                $rootScopt.$apply(function() {
                    if ('chat' in message) {
                        var chat = message.chat;
                        ChatingService.addChat(chat.from);
                        console.log(ChatingService.list);
                        ChatingService.addMessage(chat.from, chat);
                    }
                    if ('update' in message && message.update == 'addr') {
                        APIService.get({
                            do: 'addr_list'
                        }, function(data) {
                            if ('wrong' in data.status && data.status.wrong == 'offline') {
                                OnlineService.logoutReset('info');
                                $location.path('/login');
                                return;
                            }
                            OnlineService.addr_list = data.content;
                        });
                    }
                });
            };
        };

        Service.close = function() {
            ws.close();
        };
        Service.sendMessage = function(chat) {
            var date = new Date();
            var chat_message = {
                "chat": {
                            "from": OnlineService.get_id(),
                            "to": chat.heekid,
                            "content": chat.tosend,
                            "date": date.getTime(),
                        }
            };
            ChatingService.addMessage(chat.heekid, chat_message.chat);
            ws.send(JSON.stringify(chat_message));
        };

        return Service;
    }
]);
