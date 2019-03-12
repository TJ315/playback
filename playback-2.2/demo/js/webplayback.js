var rtc = null;
/**
 * 设置cookie
 * */
function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires+"; path=/";
    console.log(d)
}

/**
 * 读取cookies
 * */
function getCookie(name) {
    var arr,reg=new RegExp("(^| )"+name+"=([^;]*)(;|$)");
    if(arr=document.cookie.match(reg))
        return unescape(arr[2]);
    else
        return null;
}


//时间格式化
function sec_to_time(s) {
    var t = '';
    if (s > -1) {
        var hour = Math.floor(s / 3600);
        var min = Math.floor(s / 60) % 60;
        var sec = s % 60;
        if (s >= 3600) {
            if (hour < 10) {
                t = '0' + hour + ':';
            } else {
                t = hour + ':';
            }
        }
        if (min < 10) {
            t += '0';
        }
        t += min + ':';
        if (sec < 10) {
            t += '0';
        }
        t += sec;
    }
    return t;
}

var common = {
    init: function(){
        var _this = this;
        // 拼接当前房间获取房间session值k
        var getSessionKey = _this.roomid + '_' + _this.userid + '_' +  _this.role;
        var sessionid = getCookie(getSessionKey);
        if(sessionid ){
            common.login(sessionid);
        }else{
            _this.getSessionId();
        }
    },
    getSessionId: function(){
        var _this = this;
        
        $.ajax({
            url: "https://ccapi.csslcloud.net/api/v1/serve/room/token/create",
            type: "GET",
            dataType: "json",
            data: {
                userid: common.userid,
                roomid: common.roomid,
                liveid: common.liveid,
                recordid: common.recordid,
                name: _this.name,
                password: _this.password,
                role: 5,
                client: 0 //登录客户端类型：0: 浏览器， 1: 移动端 （必填）
            },
            success: function (data) {
                console.log(data);
                if(data.result === 'OK'){
                    var data = data.data;
                    var token = data.token;

                    console.log(data,token);
                    // 拼接当前房间获取房间session值k
                    var getSessionKey = _this.roomid + '_' + _this.userid + '_' +  _this.role;
                    setCookie(getSessionKey, token, 1);
                    common.login(token);

                }else{
                    alert('登录接口验证失败');
                }
            }
        });
    },

	login: function(token) {
		//初始化		
		rtc = new Rtc({
			userid: common.userid,
		    roomid: common.roomid,
		    liveid: common.liveid,
		    recordid: common.recordid,
		    token: token,
		    role: 'Playback',
		    isview:1
		});

		rtc.on('login_success', function(data) {
			// 登录成功
			console.log(data, 'login_success');
	
		});

		rtc.on('login_failed', function(err) {
			// 登录失败
			console.error('登录失败', err);
		});
	

		rtc.on('conference_join_failed', function(err) {
			// 加入房间失败
			console.log('加入房间失败', err);
		});    

		rtc.on('PlayTime', function(data) {
			// 播放位置
//			console.log('当前播放时间点 ' , data);
			var progress =(data.getPlayerTime/data.getDurationTime)*100+'%';// 当前播放百分比
			$('#PlayerTime').text(sec_to_time(data.getPlayerTime))
			$('#DurationTime').text(sec_to_time(data.getDurationTime))
			$("#progress").css('width',progress)
			
		});  
		
		rtc.on('chatLogdata', function (data) {
			console.log('当前播放进度之前 聊天数据:',data)
			//聊天数据
			var datalist = data;
			$('.chat-t').empty();
			for ( var i in datalist) {				
				if(datalist[i].content){
					$('.chat-t').append('<div>'+datalist[i].content+'</div>')
				}									
			}
		})
		
		rtc.on('on_cc_live_player_init', function () {
		   console.log('加载完成')
		   $(".btn-play").removeClass('btn-pause')
		});
		
		
		//播放结束
		rtc.on('on_spark_player_end', function () {
		   console.log('播放结束')
		   $(".btn-play").addClass('btn-pause')
		});
		
		
		// 拖动时间轴或跳动播放成功后回调函数
		rtc.on('on_seekComplete', function () {
		   console.log('拖动时间轴或跳动播放成功后回调函数')
		});
		
		
		// 播放暂停回调
		rtc.on('on_spark_player_pause', function () {
		   console.log('播放按钮 改为正在暂停')
		   $(".btn-play").addClass('btn-pause')
		});
		
		
		// on_spark_player_resume  恢复播放的回调|
		rtc.on('on_spark_player_resume', function () {
		   console.log('播放按钮 改为正在播放')
		    $(".btn-play").removeClass('btn-pause')
		});
		
		
		$("#btn-play").click(function(){
			CallbackPlayer.play(); //视频播放/暂停（切换）
		})
	}
};




//roomid=70DF9BF60885647A9C33DC5901307461&userid=169A751C6B4BE3F6&liveid=E5C2AA17CCEBA99F&recordid=00672D1BFC31F729
console.log('使用此demo前，必须确保你的roomid、userid、passeord、role是可用的');
//初始化	，传入房间id，用户id
common.roomid = '70DF9BF60885647A9C33DC5901307461';
common.userid = '169A751C6B4BE3F6';
common.liveid = 'E5C2AA17CCEBA99F';
common.recordid = '00672D1BFC31F729';

common.name = 'webplayback' + parseInt(Math.random() * 100);
common.password = '321'; //# 登陆密码 （如果登陆role是旁听者 或是 互动者，且支持免密码登录，则可不填，其余必填）


common.init();

