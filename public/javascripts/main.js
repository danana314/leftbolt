(function(exports){

  // Create namespace for app-level variables
  App = {};
  App.offices = _offices;
  App.officeId = _officeId;

  // Setup socket.io
  var socket = io();
  socket.on('connect', function() {
    socket.on('OfficeJoin', function(office) {
      console.log(office);
      callOffice(office.officeId);
    });
  })


  function Office(id, name, isPresent) {
    var self = this;
    self.name = ko.observable(name);
    self.id = ko.observable(id);
    self.isPresent = ko.observable(isPresent);
    self.isConnected = ko.observable(false);
  }

  // Data model
  var OfficesViewModel = function() {
    var self = this;

    self.offices = ko.observableArray();
    for (var i = 0; i < App.offices.length; i++) {
      self.offices.push(new Office(App.offices[i].id, App.offices[i].name, App.offices[i].present));
    };

    self.changePresenceById = function(officeId, presence) {
      var firstoffice = ko.utils.arrayFirst(this.offices(), function(currentOffice) {
        //return currentOffice.id() == officeId; //match on numerical id
        return currentOffice.name() == officeId;
      });
      if (firstoffice) {firstoffice.isPresent(presence);}
    };

    self.callOffice = function(office) {
      callOffice(office.name());
    };
  };
  var officesViewModel = new OfficesViewModel();
  ko.applyBindings(officesViewModel);

  // Compatibility shim
  navigator.getUserMedia = navigator.getUserMedia
                        || navigator.webkitGetUserMedia
                        || navigator.mozGetUserMedia;

  // PeerJS object
  //lwjd5qra8257b9  // Personal API key; TODO: replace
  var peer = new Peer(App.officeId , { key: 'aqu2ngp60qr7wrk9', debug: 3, 
    config: {'iceServers': [
    { url: 'stun:stun.l.google.com:19302' } // Pass in optional STUN and TURN server for maximum network compatibility
  ]}});

  peer.on('open', function(){
    officesViewModel.changePresenceById(peer.id, true);
  });

  // Receiving a call
  peer.on('call', function(call){
    // Answer the call automatically
    call.answer(App.localStream);

    // Wait for stream on the call, then set peer video display
    call.on('stream', function(stream){
      $('#remote-video').prop('src', URL.createObjectURL(stream));
      officesViewModel.changePresenceById(call.peer, true);
    });

    call.on('close', function() {
      officesViewModel.changePresenceById(call.peer, false);
    });
  });
  peer.on('error', function(err){
    alert(err.message);
    // Return to idle state if error occurs
    alert('Call receive failed')
  });

  // When everything read to start
  $(function(){
    // Get audio/video stream
    navigator.getUserMedia({audio: true, video: true}, function(stream){
      // Set your video displays
      $('#local-video').prop('src', URL.createObjectURL(stream));
      App.localStream = stream;

      // Let other offices know you have joined
      socket.emit('RegisterOffice', { officeId: App.officeId });

      //$('#remote-video').prop('src', URL.createObjectURL(stream));
    }, function(){ alert('Cannot access camera/mic'); });
  });

  // Call office
  function callOffice(officeId) {
    var call = peer.call(officeId, App.localStream);

    // Wait for stream on the call, then set peer video display
    call.on('stream', function(stream){
      $('#remote-video').prop('src', URL.createObjectURL(stream));
      officesViewModel.changePresenceById(officeId, true);
    });

    call.on('close', function() {
      officesViewModel.changePresenceById(officeId, false);
    });
  }

  function state_call_in_progress (call) {
    
  }
})(this);