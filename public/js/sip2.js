var ev2 = {
  'progress': function(e) {
    console.log('call is in progress');
  },
  'failed': function(e) {
    console.log('call failed with cause: '+ e.data.cause);
  },
  'ended': function(e) {
    console.log('call ended with cause: '+ e.data.cause);
  },
  'confirmed': function(e) {
    console.log('call confirmed');
  }
};

var callOptions = {
  mediaConstraints: {
    audio: true, // only audio calls
    video: false
  },
  'eventHandlers'    : ev2,
};

var socket = new JsSIP.WebSocketInterface('wss://192.168.0.144:8089/ws');
var configuration = {
  sockets  : [ socket ],
  uri      : 'sip:199@192.168.0.144',
  password : 'asdg',
  realm : '192.168.0.144',
  //'session_timers': false,
  contact_uri : "sip:199@192.168.0.144"
};

var coolPhone = new JsSIP.UA(configuration);

coolPhone.on('connected', function(e){ 
	console.log("connected!");


});

coolPhone.on('registered', function(e){ 
	console.log("registered!");
});

coolPhone.on('registrationFailed', function(e){ 
	console.log("reg failed!");
});


coolPhone.on('newRTCSession', function(data){ 
	console.log("newRTCSession");
	var session = data.session; 
	if (session.direction === "incoming") {
        // incoming call here
        session.on("accepted",function(){
        	console.log("accepted");
            // the call has answered
        });
        session.on("confirmed",function(){
        	console.log("confirmed");
            // this handler will be called for incoming calls too
        });
        session.on("ended",function(){
        	console.log("ended");
            // the call has ended
        });
        session.on("failed",function(e, e2){
        	console.log("failed", e, e2);
            // unable to establish the call
        });
        session.on('addstream', function(e){
            // set remote audio stream (to listen to remote audio)
            // remoteAudio is <audio> element on page
            remoteAudio = document.getElementById("remoteAudio");
            remoteAudio.src = window.URL.createObjectURL(e.stream);
            remoteAudio.play();
        });
        
        // Answer call
        session.answer(callOptions);
        
        // Reject call (or hang up it)
        //session.terminate();
    }
});

coolPhone.start();