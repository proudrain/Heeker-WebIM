var heekerCtrls = angular.module('heekerCtrls', []);

// 登陆页控制器
heekerCtrls.controller('LoginCtrl', ['$scope',
    function($scope) {
        $scope.page_class = "login";
        $scope.tabShow = "login";
        $scope.changeTab = function(tab) {
            $scope.tabShow = tab;
        };
    }
]);

// 登陆标签控制器
heekerCtrls.controller('SigninCtrl', ['$scope', '$location', 'OnlineService', 'APIService', 'SocketService',
    function($scope, $location, OnlineService, APIService, SocketService) {
        $scope.login_info = "输入你的 HeekID 和 密码";
        $scope.login_warning = '';

        $scope.login = function(id, pwd) {
            APIService.post({do: 'login'}, { "heekid": id, "password": pwd }, function(data) {
                if ('wrong' in data.status) {
                    $scope.login_info = "ID或密码错误！";
                    $scope.login_warning = 'wrong';
                }
                else {
                    user = data.content;
                    OnlineService.init(id, user.rand);
                    $scope.login_info = "登陆成功！";
                    $scope.login_warning = 'ok';
                    SocketService.conn();
                    $location.path('/heeking');
                }
            });
        };
    }
]);

// 注册标签控制器
heekerCtrls.controller('SignupCtrl', ['$scope', 'APIService',
    function($scope, APIService) {
        $scope.info = "填写以下信息进行注册";
        $scope.signup_warning = '';
        $scope.signup = function() {
            APIService.post({do: 'signup'},
                {'new_heekid': $scope.heekid, 'new_passwd': $scope.passwd, 'invitation': $scope.invitation},
                function(data) {
                    if ('ok' in data.status) {
                        $scope.info = "注册成功！"
                        $scope.signup_warning = 'ok';
                        $scope.heekid = '';
                        $scope.passwd = '';
                        $scope.confirm_passwd = '';
                        $scope.invitation = '';
                    }
                    if ('wrong' in data.status && data.status.wrong == 'repeated heekid') {
                        $scope.info = "重复的HeekID！"
                        $scope.signup_warning = 'wrong';
                    }
                    if ('wrong' in data.status && data.status.wrong == 'invalid invitation') {
                        $scope.info = "无效的邀请码！"
                        $scope.signup_warning = 'wrong';
                    }
                });
        };
    }
]);


// Chating页控制器
heekerCtrls.controller('HeekingCtrl', ['$scope', '$location', 'OnlineService', 'APIService', 'SocketService',
    function($scope, $location, OnlineService, APIService, SocketService) {
        if (!OnlineService.isOnline()) {
            $location.path('/login');
            return;
        }
        $scope.page_class = "";

        // 监听通过页面刷新或直接关闭的方式离开该页面的情况
        function logoutSure(event) {
            alert = '确定注销登陆并离开此页吗？';
            (event || window.event).returnValue = alert;
        }
        window.addEventListener('beforeunload', logoutSure);
        $scope.$on('$destroy', function() {
            window.removeEventListener('beforeunload', logoutSure);
        });

        // 监听angular路由变化离开该页面的情况
        $scope.$on('$locationChangeStart', function(event) {
            alert = confirm('确定注销登陆并离开此页吗？');
            if (!alert) {
                event.preventDefault();
            } else {
                OnlineService.logoutReset('request');
                SocketService.close();
            }
        });
    }
]);

// 主面板控制器
heekerCtrls.controller('MainPanelCtrl', ['$scope', 'WindowService', 'OnlineService',
    function($scope, WindowService, OnlineService) {
        $scope.panelState = WindowService.state;
        $scope.changeToChat = WindowService.chatDisplay;
        $scope.changeToAddr = WindowService.addrDisplay;

        $scope.online_id = OnlineService.get_id();
    }
]);

// 会话列表控制器
heekerCtrls.controller('ChatCtrl', ['$scope', 'WindowService', 'ChatingService',
    function($scope, WindowService, ChatingService) {
        $scope.chatlist = ChatingService.list;
        $scope.goChating = function(currChat) {
            ChatingService.setActive(currChat.heekid);
            WindowService.chatWinDisplay();
        }
    }
]);

// 通讯录控制器
heekerCtrls.controller('AddrCtrl', ['$scope', '$rootScope', '$location', 'OnlineService', 'APIService',
    function($scope, $rootScope, $location, OnlineService, APIService) {
        if (!OnlineService.isOnline()) {
            return;
        }

        APIService.get({ do:'addr_list' }, function(data) {
            if ('wrong' in data.status && data.status.wrong == 'offline') {
                OnlineService.logoutReset('info');
                $location.path('/login');
                return;
            }
            OnlineService.addr_list = data.content;
        });
        
        $scope.online = OnlineService;
        $scope.getCurrentInfo = function(currInfo) {
            $rootScope.currentInfo = { 'heekid': currInfo.heekid };
        }
    }
]);

//聊天窗口控制器
heekerCtrls.controller('ChatWinCtrl', ['$scope', '$timeout', 'WindowService', 'ChatingService', 'OnlineService', 'SocketService',
    function($scope, $timeout, WindowService, ChatingService, OnlineService, SocketService) {
        $scope.panelState = WindowService.state;
        $scope.currChat = ChatingService.currChat;
        $scope.myid = OnlineService.get_id();
        $scope.chatWinClose = function() {
            WindowService.chatWinClose();
            ChatingService.deleteChat(ChatingService.currChat[0]);
        }
        $scope.send = function() {
            SocketService.sendMessage(ChatingService.currChat[0]);
            ChatingService.currChat[0].tosend = '';
            console.log(ChatingService.currChat[0].msg_list);
        }
    }
]);

// 添加好友弹窗控制器
heekerCtrls.controller('AddAlertCtrl', ['$scope', '$location', 'OnlineService', 'APIService',
    function($scope, $location, OnlineService, APIService) {
        $scope.responseInfo = '';
        $scope.add_warning = '';
        $scope.addFriend = function() {
            APIService.update({ do:'addr_list' }, { "add_heekid": $scope.add_heekid }, function(data) {
                if ('wrong' in data.status) {
                    stat = data.status;
                    if (stat.wrong == 'offline') {
                        OnlineService.logoutReset('info');
                        $location.path('/login');
                    }
                    if (stat.wrong == 'not found') {
                        $scope.responseInfo = '没有这个用户！';
                        $scope.add_warning = 'wrong';
                    }
                    if (stat.wrong == 'repeated') {
                        $scope.responseInfo = '已是你的好友！';
                        $scope.add_warning = 'wrong';
                    }
                }
                if ('ok' in data.status) {
                    $scope.responseInfo = '添加成功！';
                    $scope.add_warning = 'ok';
                    OnlineService.addr_list = data.content;
                }
            });
        };
    }
]);

// 注销登陆弹窗控制器
heekerCtrls.controller('LogoutAlertCtrl', ['$scope', '$location', 'OnlineService', 'SocketService',
    function($scope, $location, OnlineService, SocketService) {
        $scope.logout = function() {
                OnlineService.logoutReset('request');
                SocketService.close();
                $location.path('/login');
        }
    }
]);

// 详细信息弹窗控制器
heekerCtrls.controller('InfoAlertCtrl', ['$scope', '$rootScope', 'WindowService', 'ChatingService',
    function($scope, $rootScope, WindowService, ChatingService) {
        $scope.chatnow = function() { 
            ChatingService.addChat($rootScope.currentInfo.heekid, true);
            WindowService.chatDisplay();
            WindowService.chatWinDisplay();
            ChatingService.setActive($rootScope.currentInfo.heekid);
        }
    }
]);
