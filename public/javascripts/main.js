(function(){

  // Create namespace for app-level variables
  App = {};
  App.isuser = _isuser;
  App.roomid = _roomid;
  App.userid = App.roomid + (App.isuser==="1" ? '_u' : '_h');

  // Setup socket.io
  var socket = io();
  socket.on('connect', function() {
    //socket.emit('register', { roomid: App.roomid, isuser: App.isuser });

    // Listen for people joining
    socket.on('join', function(isuser) {
      console.log(isuser);
      if (isuser==="0") {
        var helperid = App.roomid + '_h';
        var call = App.peer.call(helperid, App.localStream);
        call.on('stream', function(stream) {
          var audio = document.getElementById("helper-audio");
          audio.src = URL.createObjectURL(stream);
        });
      }
    });

    // Listen for mouse move events
    socket.on('moving', function (data) {
      addClick(data.xpercent*canvas.width, data.ypercent*canvas.height, data.dragging);
      drawNew();
    });

    // Listen for canvas clear
    socket.on('clearcanvas', function() {
      context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    });
  });

  // Get peer
  App.peer = new Peer(App.userid , { key: 'aqu2ngp60qr7wrk9', debug: 3, 
    config: {'iceServers': [
    { url: 'stun:stun.l.google.com:19302' } // Pass in optional STUN and TURN server for maximum network compatibility
  ]}});


  // Get user media
  // Compatibility shim between diff browser implementations
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

  // Define video sources
  var constraints = {audio: true, video: false };

  // If user, then get video stream (helper doesn't show video)
  if (App.isuser==="1"){
    
    MediaStreamTrack.getSources(function(sourceInfos) {
      var videoSource = null;
      for (var i = 0; i != sourceInfos.length; ++i) {
        var sourceInfo = sourceInfos[i];
        if (sourceInfo.kind == 'video') {
          videoSource = sourceInfo.id;

          if (sourceInfo.facing.indexOf('environment') > -1 ||
              sourceInfo.facing.indexOf('back') > -1        ||
              sourceInfo.label.indexOf('environment') > -1  ||
              sourceInfo.label.indexOf('back') > -1) {

            videoSource = sourceInfo.id;
            break;
          }
        }
      }

      constraints.video = { optional: [{sourceId: videoSource}] };
    });
    
    navigator.getUserMedia(constraints, function(stream){
      App.localStream = stream;

      var vid = document.getElementById("active-video");
      vid.src = URL.createObjectURL(stream);
      vid.muted = true;
      //$('#active-video').prop('src', URL.createObjectURL(stream));

      socket.emit('register', { roomid: App.roomid, isuser: App.isuser });


    }, function(){ alert('Cannot access camera/mic'); });
  }
  else if (App.user==="0") {
    navigator.getUserMedia(constraints, function(stream){
      App.localStream = stream;

      socket.emit('register', { roomid: App.roomid, isuser: App.isuser });

    }, function(){ alert('Cannot access camera/mic'); });
  }


  // Receiving a call
  App.peer.on('call', function(call){
    call.answer(App.localStream);  // Answer call automatically

    call.on('stream', function(stream){
      $('#active-video').prop('src', URL.createObjectURL(stream));
    });
  });

  App.peer.on('error', function(err){
    alert('Call receive failed: ' + err.message);
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
  document.getElementById('clearCanvas').onclick = clearCanvas;
  function timeoutIndications() {

  }

  var trails = [];
  var paint;

  // New point
  function newPoint(x, y, dragging) {
    socket.emit('mousemove', { xpercent: x/canvas.width, ypercent: y/canvas.height, dragging: dragging });
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

  function clearCanvas() {
    // Clears the canvas
    socket.emit('canvasclear');
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
      paint = true;
      var x = e.pageX - canvas.offsetLeft;
      var y = e.pageY - canvas.offsetTop;
      if (paint) {
          newPoint(x, y, false);
          //drawNew();
      }
  }

  function touchstartEventHandler(e) {
      paint = true;
      if (paint) {
          newPoint(e.touches[0].pageX - canvas.offsetLeft, e.touches[0].pageY - canvas.offsetTop, false);
          //drawNew();
      }
  }

  function mouseUpEventHandler(e) {
      context.closePath();
      paint = false;
      setTimeout(clearCanvas, 1500);
  }

  function mouseMoveEventHandler(e) {
      var x = e.pageX - canvas.offsetLeft;
      var y = e.pageY - canvas.offsetTop;
      if (paint) {
          newPoint(x, y, true);
          //drawNew();
      }
  }

  function touchMoveEventHandler(e) {
      if (paint) {
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