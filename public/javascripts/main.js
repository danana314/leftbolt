(function(exports){

  String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
  };

  // Create namespace for app-level variables
  App = {};
  App.userid = _userid;
  App.roomid = _roomid;

  if (App.userid.endsWith('u')) {
    App.userRole = true;
  }
  else {
    App.userRole = false;
  }

  // Setup socket.io
  var socket = io();
  socket.on('connect', function() {
    if (!App.userRole) {
      socket.emit('helperRegister', {helperId: App.userid });
    }

    socket.on('helperJoin', function(helperId) {
      console.log(helperId);
      var call = App.peer.call(helperId, App.localStream);
    });
  });

  // Get peer
  App.peer = new Peer(App.userid , { key: 'aqu2ngp60qr7wrk9', debug: 3, 
    config: {'iceServers': [
    { url: 'stun:stun.l.google.com:19302' } // Pass in optional STUN and TURN server for maximum network compatibility
  ]}});


  if (App.userRole){
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

})(this);