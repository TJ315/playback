var insetVideo = function(opts) {
	var _this = this;
	_this.opts = opts;
	_this.videodata = []; //音视频数据
	_this.videodataI = {}; //当前音视频数据
	_this.ogetPlayerTime = -1; //当前播放位置
	_this.isPlay = false; //回放 是否正在播放
	_this.Mediaisplay = false; //插播视频 是否在播放
	_this.isInterval = false; //插播视频定时器是否开启
	CallbackPlayer = $.DW; //回放全局对象

	//获取音视频链接
	_this.getUrl = function() {

		var data = {
			roomid: _this.opts.roomId,
			accountid: _this.opts.userId,
			liveid: _this.opts.liveId
		}

		$.ajax({
			type: "GET",
			url: "https://ccapi.csslcloud.net/api/record/media/track",
			data: data,
			dataType: "json",
			success: function(data) {
				console.log(data)
				if(data.result == 'OK') {
					var arr = data.data;
					//					console.log(arr);

					if(arr.length == 0) {
						return
					};

					for(var i = 0; i < arr.length - 1; i++) {
						var Itime = Math.floor(arr[i].time / 1000)
						for(var j = i + 1; j < arr.length; j++) {
							var Jtime = Math.floor(arr[j].time / 1000)
							if(Itime == Jtime) {
								arr.splice(i, 1); //console.log(arr[j]);
								j--;
							}
						}
					}
					//					console.log(arr); 
					var data = arr;
					var len = data.length;
					var i = 0;

					function addURL(i) {
						if(i == len) {
							return
						}

						if(i > 0 && data[i].mediaid == data[i - 1].mediaid) {
							data[i].url = data[i - 1].url;
							addURL(i + 1)
						} else {

							var mediadata = {
								account_id: _this.opts.userId,
								video_id: data[i].mediaid,
							};
							$.ajax({
								type: "GET",
								url: "https://ccapi.csslcloud.net/api/v1/serve/video/playurl",
								data: mediadata,
								dataType: "json",
								success: function(res) {
									if(res.result == 'OK') {
										data[i].url = res.data.pc_playurl;
										addURL(i + 1)
									}
								}
							});
						}
						_this.videodata = data;
					}

					addURL(0)

					_this.openInset() //开启计时器
				}
			}
		});
	};

	//开启定时器
	_this.openInset = function() {
		if(_this.isInterval) {
			return
		}

		_this.Interval = setInterval(function() {
			_this.isInterval = true;
			var getPlayerTime = CallbackPlayer.getPlayerTime()
			_this.ogetPlayerTime = getPlayerTime;
			_this.openMedia()

		}, 1000)
	};
	//每秒操作
	_this.openMedia = function() {
		var videodata = _this.videodata;
		var getPlayerTime = Math.floor(_this.ogetPlayerTime);

		for(var i = 0; i < videodata.length; i++) {
			var time = Math.floor(videodata[i].time / 1000);
			if(time == getPlayerTime) {
				_this.appendMedia(videodata[i])
			}
		};

		if(_this.$insetVideo && _this.$insetVideo.getAttribute('type') == 2) { //音频		
			var paused = _this.$Media.paused;

			if(paused) { //暂停
				_this.$insetVideo.getElementsByClassName('play-pause')[0].className = 'play-pause pause';
			} else { //播放着				
				_this.$insetVideo.getElementsByClassName('play-pause')[0].className = 'play-pause play';
				var currentTime = Math.floor(_this.$Media.currentTime);
				var duration = Math.floor(_this.$Media.duration);
				var progress = currentTime / duration * 100 + '%';
				_this.$insetVideo.getElementsByClassName('played')[0].innerText = _this.sec_to_time(currentTime);
				_this.$insetVideo.getElementsByClassName('duration')[0].innerText = _this.sec_to_time(duration);
				_this.$insetVideo.getElementsByClassName('progress')[0].style.width = progress;
			}

			//			console.log(duration, currentTime, paused)
		}

		var videodataI = _this.videodataI; //当前音视频对象
		//		console.log(_this.$Media ,_this.$Media.duration , JSON.stringify(videodataI) !== "{}")
		if(_this.$Media && _this.$Media.duration && JSON.stringify(videodataI) !== "{}") {
			var duration = _this.$Media.duration; //插播媒体时长；
			var getPlayerTime = CallbackPlayer.getPlayerTime() //回放位置；
			var pos = parseInt(videodataI.pos)
			var time = parseInt(videodataI.time / 1000)
			var times = Math.round((getPlayerTime - time + pos) % duration);
			//			console.log(_this.$Media.currentTime ,times,getPlayerTime)
			var abss = Math.abs(_this.$Media.currentTime - times);
			if(abss >= 2 && _this.Mediaisplay) {
				_this.$Media.currentTime = times
			}

		}

	}

	//创建音视频
	_this.appendMedia = function(data) {
		var data = data;
		//		console.log(data)
		_this.videodataI = data; //音视频当前对象
		
		if(!document.getElementById('insetMedia')){return};
		
		if(!document.getElementById('insetVideo')) { //不存在  音视频元素
			//			console.log(data.time)			

			if(data.operate == -1) { //删除
				return;
			};
			var $dominset = document.createElement('div');

			$dominset.setAttribute('id', 'insetVideo');
			$dominset.setAttribute('mediaid', data.mediaid);
			$dominset.setAttribute('type', data.type);
			if(data.type == 1) { //视频		
				$dominset.className = 'inset-Video';
				var mediaid = 'id' + data.mediaid;
				var x = '<p class="inset-title">' + data.filename + '</p>' +
					'<div class="media-box"><video id="' + mediaid + '" src="' + data.url + '" loop="loop"></video></div>';
			} else if(data.type == 2) { //音频
				$dominset.className = 'inset-Audio';
				var mediaid = 'id' + data.mediaid;
				var x = '<p class="inset-title">' + data.filename + '</p>' +
					'<div class="media-box"><audio id="' + mediaid + '" src="' + data.url + '" loop="loop"></audio>' +
					'<div class="play-pause play"></div>' +
					'<div class="scrubber">' +
					'<div class="progress" style="width: 0%;"></div>' +
					'</div>' +
					'<div class="time"><em class="played">00:02</em>/<strong class="duration">04:34</strong></div></div>';

			}
			$dominset.innerHTML = x;
			document.getElementById('insetMedia').appendChild($dominset);
			_this.$insetVideo = document.getElementById('insetVideo'); //盒子元素
			_this.$Media = document.getElementById('id' + data.mediaid); //音视频元素			
		} else { //存在  音视频元素
			var mediaid = _this.$insetVideo.getAttribute('mediaid')
			if(mediaid != data.mediaid) { //不是应该存在的媒体
				_this.Mediaisplay = false;
				var child = document.getElementById('insetVideo');
				child.parentNode.removeChild(child);

				var $dominset = document.createElement('div');

				$dominset.setAttribute('id', 'insetVideo');
				$dominset.setAttribute('mediaid', data.mediaid);
				$dominset.setAttribute('type', data.type);
				if(data.type == 1) { //视频		
					$dominset.className = 'inset-Video';
					var mediaid = 'id' + data.mediaid;
					var x = '<p class="inset-title">' + data.filename + '</p>' +
						'<div class="media-box"><video id="' + mediaid + '" src="' + data.url + '" loop="loop"></video></div>';
				} else if(data.type == 2) { //音频
					$dominset.className = 'inset-Audio';
					var mediaid = 'id' + data.mediaid;
					var x = '<p class="inset-title">' + data.filename + '</p>' +
						'<div class="media-box"><audio id="' + mediaid + '" src="' + data.url + '" loop="loop"></audio>' +
						'<div class="play-pause play"></div>' +
						'<div class="scrubber">' +
						'<div class="progress" style="width: 0%;"></div>' +
						'</div>' +
						'<div class="time"><em class="played">00:02</em>/<strong class="duration">04:34</strong></div></div>';

				}
				$dominset.innerHTML = x;
				document.getElementById('insetMedia').appendChild($dominset);
				_this.$insetVideo = document.getElementById('insetVideo'); //盒子元素
				_this.$Media = document.getElementById('id' + data.mediaid); //音视频元素
			} else {

			}
		}
		document.getElementById('playbackVideo').muted=false;
		if(data.operate == 1) { //播放	
			if(_this.isPlay) {
				_this.$Media.play()
			}
			_this.Mediaisplay = true; //插播视频 在播放

			var duration = _this.$Media.duration; //插播媒体时长；
			if(duration) {
				var getPlayerTime = CallbackPlayer.getPlayerTime() //回放位置；
				var pos = parseInt(data.pos)
				var time = parseInt(data.time / 1000)
				var times = Math.round((getPlayerTime - time + pos) % duration);

				_this.$Media.currentTime = times;
				//				console.log(duration,getPlayerTime,pos,times)
			}
		} else if(data.operate == 0) { //暂停		

			_this.Mediaisplay = false;
			_this.$Media.pause()

			var duration = _this.$Media.duration; //插播媒体时长；
			if(duration) {
				var getPlayerTime = CallbackPlayer.getPlayerTime() //回放位置；
				var pos = parseInt(data.pos)
				var time = parseInt(data.time / 1000)
				var times = Math.round((getPlayerTime - time + pos) % duration);

				_this.$Media.currentTime = times;
				//				console.log(duration,getPlayerTime,pos,times)
			}
		} else if(data.operate == 2) { //拖动		

			if(data.last_operate == 1) { //播放			
				if(_this.isPlay) { //回放是否 正在进行
					_this.$Media.play()
				} else {
					_this.$Media.pause()
				}
				_this.Mediaisplay = true; //插播视频 在播放
			} else { //暂停
				_this.$Media.pause()
				_this.Mediaisplay = false; //插播视频 在暂停
			}
			var duration = _this.$Media.duration; //插播媒体时长；
			if(duration) {
				var getPlayerTime = CallbackPlayer.getPlayerTime() //回放位置；
				var pos = parseInt(data.pos)
				var time = parseInt(data.time / 1000)
				var times = Math.round((getPlayerTime - time + pos) % duration);

				//				console.log(getPlayerTime,time,pos,duration)
				//				console.log(_this.$Media.currentTime,times)

				if(data.last_operate == 1) { //播放
					_this.$Media.currentTime = times;
				} else { //暂停
					_this.$Media.currentTime = data.pos;
				}
			}

		} else if(data.operate == -1) { //删除
			if(document.getElementById('insetVideo')) {
				_this.Mediaisplay = false;
				var child = document.getElementById('insetVideo');
				child.parentNode.removeChild(child);
				document.getElementById('playbackVideo').muted=true;
			}
		};

		//监听到视频时长变化时
		_this.$Media.addEventListener("durationchange", function() {
			var duration = _this.$Media.duration; //插播媒体时长；
			var getPlayerTime = CallbackPlayer.getPlayerTime() //回放位置；
			var pos = parseInt(data.pos)
			var time = parseInt(data.time / 1000)
			var times = Math.round((getPlayerTime - time + pos) % duration);

			//			console.log(duration,getPlayerTime,pos,times)

			_this.$Media.currentTime = times;

		});

	}
	//暂停
	_this.pause = function() {
		if(insetVideo && insetVideo.Mediaisplay && insetVideo.$Media) {
			insetVideo.$Media.pause()
		}
	};

	//播放
	_this.play = function() {
		if(insetVideo && insetVideo.Mediaisplay && insetVideo.$Media) {
			insetVideo.$Media.play()
		}
	};

	//	跳转到某个时间点完成
	_this.seek = function() {

		var videodata = _this.videodata;
		if(videodata.length > 0) {
			var getPlayerTime = Math.floor(CallbackPlayer.getPlayerTime());
			var arr = [];
			for(var i = 0; i < videodata.length; i++) {
				var videodataI = videodata[i];
				var time = parseInt(videodataI.time / 1000);
				//				console.log(time ,getPlayerTime)				
				if(time <= getPlayerTime) {
					arr.push(videodataI)
				}
			}

			var videods = arr[arr.length - 1];

			//			console.log(videods,_this.ogetPlayerTime,getPlayerTime,'跳转到某个时间点完成')

			if(videods) {
				_this.appendMedia(videods)
			} else {
				if(document.getElementById('insetVideo')) {
					_this.Mediaisplay = false;
					var child = document.getElementById('insetVideo');
					child.parentNode.removeChild(child);
					document.getElementById('playbackVideo').muted=true;
				}
			}
		};
	};

	//播放停止
	_this.end = function() {
		if(document.getElementById('insetVideo')) {
			_this.Mediaisplay = false;
			var child = document.getElementById('insetVideo');
			child.parentNode.removeChild(child);
			document.getElementById('playbackVideo').muted=true;
		}
	};

	//时间格式化
	_this.sec_to_time = function(s) {
		var t = '';
		if(s > -1) {
			var hour = Math.floor(s / 3600);
			var min = Math.floor(s / 60) % 60;
			var sec = s % 60;
			if(s >= 3600) {
				if(hour < 10) {
					t = '0' + hour + ':';
				} else {
					t = hour + ':';
				}
			}
			if(min < 10) {
				t += '0';
			}
			t += min + ':';
			if(sec < 10) {
				t += '0';
			}
			t += sec;
		}
		return t;
	}

	_this.getUrl() //获取视频列表

}

// on_spark_player_pause  播放暂停回调|
// on_spark_player_resume  恢复播放的回调|
// on_spark_player_end 播放结束回调|
// on_player_start 播放开始回调|
// seekStart 开始跳转到某个时间点|
// seekComplete 跳转到某个时间点完成|

function inset_on_cc_live_player_load(opts) { // 播放器加载完成   
	//	console.log('播放器加载完成')
	if(typeof insetVideo == 'function') {
		window.insetVideo = new insetVideo(opts);
	}
}

function inset_on_player_start() { // 播放开始
	//	console.log('播放开始');
	insetVideo.isPlay = true;
	// 播放后再把视频缩小
}

function inset_on_spark_player_pause() { // 播放暂停
	//	console.log('播放暂停');
	insetVideo.isPlay = false;
	insetVideo.pause() //暂停音视频

}

function inset_on_spark_player_resume() { // 恢复播放
	//	console.log('恢复播放');
	insetVideo.isPlay = true;
	insetVideo.play() //恢复音视频

}

function inset_on_spark_player_end() { // 播放停止
	//	console.log('播放停止');
	insetVideo.isPlay = false;
	insetVideo.end() //播放停止
}

//跳转到某个时间点完成
function inset_seekComplete() {
	//	console.log('跳转到某个时间点完成');
	insetVideo.seek() //恢复音视频

}