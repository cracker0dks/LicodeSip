var socket = new JsSIP.WebSocketInterface('wss://192.168.0.222:8089/ws');
var configuration = {
  sockets  : [ socket ],
  uri      : 'sip:199@192.168.0.222',
  password : '199',
  realm : '192.168.0.222',
  'session_timers': false,
  contact_uri : "sip:199@192.168.0.222",
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
window.AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext = new AudioContext(); 
var answerLstream = audioContext.createMediaStreamDestination();
var localLicodeStream;
coolPhone.on('newRTCSession', function(data){ 
	console.log("newRTCSession", data);
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
        session.on("failed",function(e){
        	console.log("failed", e);
            // unable to establish the call
        });

        session.on("newDTMF",function(e, e1){
        	console.log("newDTMF", e, e1);
            // unable to establish the call
        });



        
        // Answer call
        session.answer(callOptions);


        var callOptions = {
		  mediaConstraints: {
		    audio: true, // only audio calls
		    video: false
		  },
		  pcConfig: {rtcpMuxPolicy: 'negotiate'},
		  mediaStream : answerLstream.stream
		};


        session.connection.addEventListener('addstream', (e) =>
		{
			console.log("Debug: addstream............", e.stream);
			console.log("Debug: roomname............", session["_request"]["headers"]["Roomnumber"]["0"]["raw"]);
			
			var config = {audio: true, video: false, data: false };
    		getLocalStream(config, function(localStream) {
    			localLicodeStream = localStream;
    			localStream.stream = e.stream;
				publishLocalStream(localStream, roomname, null, function(ret) {
					console.log(ret)
				});
			});  			
		});

        // Reject call (or hang up it)
        //session.terminate();
    }
});

coolPhone.start();