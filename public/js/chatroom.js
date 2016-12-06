(function(){

  // Create namespace for app-level variables
  App = {};
  App.isRequester = _isuser;
  App.roomid = _roomid;
  App.userid = App.roomid + (App.isRequester==="1" ? '_u' : '_h');


  // Setup socket.io
  /*
  var socket = io();
  socket.on('connect', function() {
    // Listen for mouse move events
    socket.on('moving', function (data) {
      addClick(data.xpercent*canvas.width, data.ypercent*canvas.height, data.dragging);
      drawNew();
    });

    // Listen for canvas clear
    socket.on('clearcanvas', function() {
      clearCanvas();
    });
  });
  */


  // --------------------
  // WebRTC
  // --------------------
  
  easyrtc.enableVideo(App.isRequester==="1");    // Only enable video for requesting user (helper doesn't show)
  easyrtc.enableAudio(true);
  easyrtc.enableDataChannels(true);
  
  easyrtc.joinRoom(App.roomid, null, 
                    function(roomName) {console.log("I'm now in room " + roomName);},
                    function(errorCode, errorText, roomName) {console.log("had problems joining " + roomName);}
  );  // Success/fail will not be called since not connected to server
  easyrtc.setRoomOccupantListener( roomListener);
  
  
  var connectSuccess = function(myId) {
      console.log("My easyrtcid is " + myId);
      App.userid = myId;
  }
  var connectFailure = function(errorCode, errText) {
      console.log(errText);
      alert('Cannot access camera/mic');
  }
  if (App.isRequester==="1"){
    easyrtc.initMediaSource(
          function(){                     // success callback
              var vid = document.getElementById("active-video");
              easyrtc.setVideoObjectSrc(vid, easyrtc.getLocalStream());
              vid.muted = true;           // prevent feedback loop
              easyrtc.connect("LeftBolt", connectSuccess, connectFailure);
          },
          connectFailure
    );
  } else if (App.isRequester==="0") {
    easyrtc.initMediaSource(
          function(){          // success callback
              easyrtc.connect("LeftBolt", connectSuccess, connectFailure);
          },
          connectFailure
    );
  }
  
  function roomListener(roomName, otherPeers) {
    for(var i in otherPeers) {
      easyrtc.call(
         i,
         function(easyrtcid) { console.log("completed call to " + easyrtcid);},
         function(errorCode, errorText) { console.log("err:" + errorText);},
         function(accepted, bywho) {
            console.log((accepted?"accepted":"rejected")+ " by " + bywho);
         }
     );
    }
  }
  
  easyrtc.setStreamAcceptor( function(callerEasyrtcid, stream) {
    if (callerEasyrtcid == App.userid)
    {
      // Don't deal with stream from self.
      return;
    }
    if (App.isRequester==="1") {
      var audio = document.getElementById("helper-audio");
      audio.src = URL.createObjectURL(stream);
      audio.autoplay = true;
    } else if (App.isRequester==="0") {
      var vid = document.getElementById("active-video");
      easyrtc.setVideoObjectSrc(vid, stream);
    }
  });

  easyrtc.setOnStreamClosed( function (callerEasyrtcid) {
    if(App.isRequester==="1") {
      var audio = document.getElementById("helper-audio");
      audio.src = "";
    } else if (App.isRequester==="0") {
      var vid = document.getElementById("active-video");
      easyrtc.setVideoObjectSrc(vid, "");
    }
  });

  // Error handler
  easyrtc.setOnError( function(errEvent) { console.log(errEvent.errorText);});


  // --------------------
  // Setup WebSockets
  // --------------------
  var sendDataWSErrorHandler = function(ackMesg) {
    if( ackMesg.msgType === 'error' ) {
      console.log(ackMesg.msgData.errorText);
    }
  }
  
  easyrtc.setPeerListener( function(senderId, msgType, msgData, targeting) {
    if(msgType === 'canvasClear') {
      clearCanvas();
      console.log('msg:' + senderId  + ': canvas clear');
    } else if (msgType == 'moving') {
      addClick(msgData.xpercent*canvas.width, msgData.ypercent*canvas.height, msgData.dragging);
      drawNew();
      console.log('msg:' + senderId  + ': moving : ' + msgData.xpercent + ' ' + msgData.ypercent + ' ' + msgData.dragging);
    } else {
      console.log('msg:' + senderId  + ':' + msgType + ', ' + msgData);
    }
  });



  // --------------------
  // Share Link
  // --------------------
  document.getElementById('sendInvite').onclick = sendInvite;

  function sendInvite() {
    var parser = document.createElement('a');
    parser.href = document.URL;
    var sharelink = parser.protocol+'//'+parser.host+'/r/'+App.roomid+'/0/';

    var subject='Show Me';
    var body="Hi,\n\n"+"Please show me how to do something! Join me at the link below:\n\n" +
      "    "+sharelink+"\n\n"+"Thanks!";
    subject=encodeURIComponent(subject);
    body=encodeURIComponent(body);

    window.open('mailto:?subject='+subject+'&body='+body);
  }


  // --------------------
  // Drawing
  // --------------------

  var remoteVid = document.getElementById('active-video');
  var canvas = document.getElementById('sheet');
  canvas.width = remoteVid.offsetWidth;
  canvas.height = remoteVid.offsetHeight;

  context = canvas.getContext("2d");
  context.strokeStyle = "#ebe41c";
  context.lineJoin = "round";
  context.lineWidth = 15;
  context.globalAlpha = 0.1;

  // Clear user indications
  document.getElementById('clearCanvas').onclick = clearCanvasNotify;

  var trails = [];
  var isDrawing;

  // New point
  function newPoint(x, y, dragging) {
    //socket.emit('mousemove', { xpercent: x/canvas.width, ypercent: y/canvas.height, dragging: dragging });
    easyrtc.sendDataWS({targetGroup: App.roomid}, 'moving', 
      { xpercent: x/canvas.width, ypercent: y/canvas.height, dragging: dragging }, 
      sendDataWSErrorHandler);
    addClick(x, y, dragging);
    drawNew();
  }

  // Add information where the user clicked at.
  function addClick(x, y, dragging) {
    var trailObj = new Object();
    trailObj.x = x;
    trailObj.y = y;
    trailObj.dragging = dragging;
    trailObj.time = Date.now();
    trails.push(trailObj);
  }

  function clearCanvasNotify() {
    easyrtc.sendDataWS( {targetGroup: App.roomid}, 'canvasClear', null, sendDataWSErrorHandler);
    //socket.emit('canvasclear');
    clearCanvas();    
  }
  function clearCanvas() {
    // Clears the canvas
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  }

   // Draw the newly added point.
  function drawNew() {
    var i = trails.length - 1
    if (!trails[i].dragging) {
        if (trails.length == 0) {
            context.beginPath();
            context.moveTo(trails[i].x, trails[i].y);
            context.stroke();
        } else {
            context.closePath();

            context.beginPath();
            context.moveTo(trails[i].x, trails[i].y);
            context.stroke();
        }
    } else {
        context.lineTo(trails[i].x, trails[i].y);
        context.stroke();
    }
  }

  function mouseDownEventHandler(e) {
      isDrawing = true;
      var x = e.pageX - canvas.offsetLeft;
      var y = e.pageY - canvas.offsetTop;
      if (isDrawing) {
          newPoint(x, y, false);
          //drawNew();
      }
  }

  function touchstartEventHandler(e) {
      isDrawing = true;
      if (isDrawing) {
          newPoint(e.touches[0].pageX - canvas.offsetLeft, e.touches[0].pageY - canvas.offsetTop, false);
          //drawNew();
      }
  }

  function mouseUpEventHandler(e) {
      context.closePath();
      isDrawing = false;
      //setTimeout(clearCanvas, 1500);
  }

  function mouseMoveEventHandler(e) {
      var x = e.pageX - canvas.offsetLeft;
      var y = e.pageY - canvas.offsetTop;
      if (isDrawing) {
          newPoint(x, y, true);
          //drawNew();
      }
  }

  function touchMoveEventHandler(e) {
      if (isDrawing) {
          newPoint(e.touches[0].pageX - canvas.offsetLeft, e.touches[0].pageY - canvas.offsetTop, true);
          //drawNew();
      }
  }

  function setUpHandler(isMouseandNotTouch, detectEvent) {
      removeRaceHandlers();
      if (isMouseandNotTouch) {
          canvas.addEventListener('mouseup', mouseUpEventHandler);
          canvas.addEventListener('mousemove', mouseMoveEventHandler);
          canvas.addEventListener('mousedown', mouseDownEventHandler);
          mouseDownEventHandler(detectEvent);
      } else {
          canvas.addEventListener('touchstart', touchstartEventHandler);
          canvas.addEventListener('touchmove', touchMoveEventHandler);
          canvas.addEventListener('touchend', mouseUpEventHandler);
          touchstartEventHandler(detectEvent);
      }
  }

  function mouseWins(e) {
      setUpHandler(true, e);
  }

  function touchWins(e) {
      setUpHandler(false, e);
  }

  function removeRaceHandlers() {
      canvas.removeEventListener('mousedown', mouseWins);
      canvas.removeEventListener('touchstart', touchWins);
  }

  canvas.addEventListener('mousedown', mouseWins);
  canvas.addEventListener('touchstart', touchWins);

})(this);