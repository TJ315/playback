[TOC]



# 1. 文档介绍

### 	1.1 文档目的

​	分流回放sdk 是一个适用于小班课回放角色的SDK，使用此SDK可以与CC视频云服务进行对接，快速接入回放角色音视频服务。通过此文档，方便客户对接小班课回放。

### 

# 2.SDK使用介绍

## 2.1 开发准备

### 2.1.1 回放sdk引用

```
 <script src="./static/js/playback_sdk.js"></script>
```

### 2.1.2 视频播放引用

```
<!-- //videojs 插件 -->
<script src="../js/Unpacked/video.js"></script>
```

### 2.1.3 文档 引用

```
<script src="//image.csslcloud.net/js/dpc.js"></script>
```


## 2.2 auth流程 

- 描述

```
获取token
备注 回放用户的role填写为'5'
```

- 地址

```
 https://ccapi.csslcloud.net/api/v1/serve/room/token/create
```

- 方法

```
POST/GET
```

- 请求参数

| 参数名称 | 参数类型 | 参数说明                    | 备注 |
| -------- | -------- | --------------------------- | ---- |
| name     | 字符串   | 登录名                      | 必须 |
| userid   | 字符串   | 用户账号ID                  | 必须 |
| roomid   | 字符串   | 房间ID                      | 必须 |
| password | 字符串   | 登录密码                    | 可选 |
| role     | 字符串   | 回放角色 5                  | 必须 |
| client   | 字符串   | 客户端类型 0:web端 1:移动端 | 必须 |
| liveid   | 字符串   | 直播ID                      | 必须 |
| recordid | 字符串   | 回放ID                      | 必须 |

- 返回数据格式

```
{
  "data": {
    "chatHost": "http://replay?platform=2&roomid=654EEE3470C7E4AD9C33DC5901307461&sessionid=E1356FEF27648664A3DC960780A1AE8C0B5D543739043ABE321D5D33B8DB4897D3DC0599C156252C895EA9DB8CE54F0A&terminal=1", 
    "template": {
      "chatView": 1, 
      "desc": "\u89c6\u9891\uff0c\u6587\u6863\uff0c\u804a\u5929", 
      "iconPath": "ltab1", 
      "id": 4, 
      "name": "\u6a21\u677f\u56db", 
      "pdfView": 1, 
      "qaView": 0, 
      "status": 1, 
      "type": 4
    }, 
    "token": "E1356FEF27648664A3DC960780A1AE8C0B5D543739043ABE321D5D33B8DB4897D3DC0599C156252C895EA9DB8CE54F0A"
  }, 
  "result": "OK"
}
```

 

##  2.3 初始化sdk

```
var rtc = new Rtc({
	userid：userid,
    roomid:roomid,
    liveid：liveid,
    recordid：recordid,
    token：token
});	

```

- 使用建议
目前token有效期是24小时，获取到token后，建议把token存在cookie，失效设置为24小时。初始化sdk之前判断token是否过期。

## 2.4 重要事件监听
```
 
rtc.on('login_success', function (data) {
    // 账号登录成功
    console.log(data,'login_success');
}); 
    
rtc.on('login_failed', function (err) {
    // 账号登录失败
    console.error('登录失败',err);
});

```

# 3 视频


##3.1 标签元素

```
<!--老师视频-->	
<div id="presenterVideo"></div>

<!--学生视频-->			
ul id="studentVideo"></ul>

<!--插播音视频-->	
<div class="inset-media" id="insetMedia"></div>


```

##3.2 视频主动事件

```
CallbackPlayer.play(); //视频播放/暂停（切换）

CallbackPlayer.seek(50) //改变播放位置，传入时间
   
```

##3.3 视频监听事件

- 视频加载完成
```
rtc.on('on_cc_live_player_init', function () {
   console.log('加载完成')
});


//播放结束
rtc.on('on_spark_player_end', function () {
   console.log('播放结束')
});


// 拖动时间轴或跳动播放成功后回调函数
rtc.on('on_seekComplete', function () {
   console.log('拖动时间轴或跳动播放成功后回调函数')
});


// 播放暂停回调
rtc.on('on_spark_player_pause', function () {
   console.log('播放按钮 改为正在暂停')
});


// on_spark_player_resume  恢复播放的回调|
rtc.on('on_spark_player_resume', function () {
   console.log('播放按钮 改为正在播放')
});

rtc.on('PlayTime', function(data) {
	// 播放位置	变化		
    {
        getBufferTime: 0，		//缓冲位置
        getDurationTime: 841，	//回放时长
        getPlayerTime: 1		//当前回放时间点
    }
}); 

```

## 3.4  插播视频事件监听

```

rtc.on('insetMediaCreateDom', function () {
   console.log('视频元素创建成功')
});

rtc.on('insetMediaRemoveDom', function () {
   console.log('视频元素移除成功')
});


```

## 3.5  共享桌面视频事件监听

###3.5.1  共享桌面标签元素

推荐 dom 结构

```

<!-- 桌面共享流 -->
<div id="sharedStreambox" class="shared-stream-box">
    <p class="shared-stream-title">共享桌面</p>
    <ul id="sharedStream" class="shared-stream"></ul>
    <div class="shared-stream-bottom">
        <span>共享人:</span>
        <span class="shared-person">sdk会在这里插入共享人的name</span>
        <div class="shared-stream-enlarge"></div>
    </div>
</div>		


```

或者使用 简洁 dom结构
```
<!-- 桌面共享流 -->
 <ul id="sharedStream" class="shared-stream"></ul>
```
###3.5.2  共享桌面视频事件监听
```
//因为桌面共享流，有提前20s预加载功能，建议用户在监听到sharedStreamShow事件后，再显示.shared-stream-box
rtc.on('sharedStreamShow', function () {
   console.log('显示桌面共享流盒子')
   
});

rtc.on('sharedStreamRemove', function () {
   console.log('桌面共享流已删除')
});


```
# 4 画板

## 4.1 标签元素

```
<!--画板显示区域-->
<div id="draw-parent"></div>
```




##4.2 其他画板功能

参考画板文档[说明文档](https://github.com/CCVideo/CloudClass_Web_Module_SDK/wiki/%E7%94%BB%E6%9D%BF%E7%BB%84%E4%BB%B6%E6%96%87%E6%A1%A3)，详情查看Demo

# 5 聊天

##5.1 监听到历史数据

```
//当前播放进度之前 聊天数据
rtc.on('chatLogdata', function (data) {//监听到 获取聊天历史数据
	console.log('当前播放进度之前 聊天数据')
	console.log(data)
})
```
