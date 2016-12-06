 easyrtc.setStreamAcceptor( function(callerEasyrtcid, stream) {
    var video = document.getElementById('caller');
    easyrtc.setVideoObjectSrc(video, stream);
});

 easyrtc.setOnStreamClosed( function (callerEasyrtcid) {
    easyrtc.setVideoObjectSrc(document.getElementById('caller'), "");
});


function my_init() {
    easyrtc.enableAudio(true);
    easyrtc.enableVideo(true);
    easyrtc.enableDataChannels(true);
    easyrtc.joinRoom("DefaultRoom", null, 
        function(roomName) {
           console.log("I'm now in room " + roomName);
        },
        function(errorCode, errorText, roomName) {
            console.log("had problems joining " + roomName);
        }
    );
    easyrtc.setRoomOccupantListener( roomListener);
    var connectSuccess = function(myId) {
        console.log("My easyrtcid is " + myId);
    }
    var connectFailure = function(errorCode, errText) {
        console.log(errText);
    }
    easyrtc.initMediaSource(
          function(){          // success callback
              var selfVideo = document.getElementById("self");
              easyrtc.setVideoObjectSrc(selfVideo, easyrtc.getLocalStream());
              easyrtc.connect("leftbolt.examplertc", connectSuccess, connectFailure);
          },
          connectFailure
    );
}


function roomListener(roomName, otherPeers) {
    var otherClientDiv = document.getElementById('otherClients');
    while (otherClientDiv.hasChildNodes()) {
        otherClientDiv.removeChild(otherClientDiv.lastChild);
    }
    for(var i in otherPeers) {
        var button = document.createElement('button');
        button.onclick = function(easyrtcid) {
            return function() {
                performCall(easyrtcid);
            }
        }(i);

        label = document.createTextNode(i);
        button.appendChild(label);
        otherClientDiv.appendChild(button);
    }
}


function performCall(easyrtcid) {
    easyrtc.call(
       easyrtcid,
       function(easyrtcid) { console.log("completed call to " + easyrtcid);},
       function(errorCode, errorText) { console.log("err:" + errorText);},
       function(accepted, bywho) {
          console.log((accepted?"accepted":"rejected")+ " by " + bywho);
       }
   );
}