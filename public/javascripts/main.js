(function(exports){

  String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
  };

  // Create namespace for app-level variables
  App = {};
  App.isuser = _isuser;
  App.roomid = _roomid;
  App.userid = App.roomid + (App.isuser==="1" ? '_u' : '_h');

  // Setup socket.io
  var socket = io();
  socket.on('connect', function() {
    socket.emit('register', { roomid: App.roomid, isuser: App.isuser });

    // Listen for people joining
    socket.on('join', function(isuser) {
      console.log(isuser);
      if (isuser==="0") {
        var helperid = App.roomid + '_h';
        var call = App.peer.call(helperid, App.localStream);
      }
    });

    // Listen for mouse move events
    socket.on('mousemove', function (data) {
        socket.broadcast.emit('moving', data);
    });
  });

  // Get peer
  App.peer = new Peer(App.userid , { key: 'aqu2ngp60qr7wrk9', debug: 3, 
    config: {'iceServers': [
    { url: 'stun:stun.l.google.com:19302' } // Pass in optional STUN and TURN server for maximum network compatibility
  ]}});


  if (App.isuser==="1"){
    // Compatibility shim
    navigator.getUserMedia = navigator.getUserMedia
                          || navigator.webkitGetUserMedia
                          || navigator.mozGetUserMedia;
    // Get audio/video stream
    navigator.getUserMedia({audio: true, video: true}, function(stream){
      //$('#local-video').prop('src', URL.createObjectURL(stream));
      App.localStream = stream;

      // Let other offices know you have joined
      //socket.emit('register', { officeId: App.officeId });

      $('#remote-video').prop('src', URL.createObjectURL(stream));
    }, function(){ alert('Cannot access camera/mic'); });
  }
  

  // Receiving a call
  App.peer.on('call', function(call){
    call.answer(App.localStream);  // Answer call automatically

    call.on('stream', function(stream){
      $('#remote-video').prop('src', URL.createObjectURL(stream));
    });
  });

  App.peer.on('error', function(err){
    alert('Call receive failed: ' + err.message);
  });


  // --------------------
  // Drawing
  // --------------------

  // Require canvas support
  if(!('getContext' in document.createElement('canvas'))){
    alert('Sorry, it looks like your browser does not support canvas!');
    return false;
  }

  var doc = $(document),
    win = $(window),
    canvas = $('#paper'),
    ctx = canvas.getContext("2d");

  var vid = document.getElementById("remote-video");
  //var canvas = document.getElementById("paper");
  canvas.height = vid.height;
  canvas.width  = vid.width;

  // A flag for drawing activity
  var drawing = false;

  socket.on('moving', function (data) {
    console.log(data);
    if(data.drawing){
      drawLine(data.xi, data.yi, data.xf, data.yf);
    }
  });

  var prev = {};

  canvas.on('mousedown',function(e) {
    e.preventDefault();
    drawing = true;
    prev.x = e.pageX;
    prev.y = e.pageY;

  });

  doc.bind('mouseup mouseleave',function() {
    drawing = false;
  });

  var lastEmit = $.now();

  doc.on('mousemove',function(e) {
    if($.now() - lastEmit > 30) {
      socket.emit('mousemove',
        {
          'xi': prev.x,
          'yi': prev.y,
          'xf': e.pageX,
          'yf': e.pageY,
          'drawing': drawing
        }
      );

      // Draw a line for current user's movement (not broadcast back)
      if(drawing) {
        drawLine(prev.x, prev.y, e.pageX, e.pageY);

        prev.x = e.pageX;
        prev.y = e.pageY;
      }

      lastEmit = $.now();
    }
    
    
  });


  function drawLine(xi, yi, xf, yf){
      ctx.moveTo(xi, yi);
      ctx.lineTo(xf, yf);
      ctx.stroke();
  }

})(this);