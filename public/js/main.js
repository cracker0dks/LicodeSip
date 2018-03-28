/* ---------------- */
/* ---- CONFIG ---- */
/* ---------------- */
var WebSocketInterface = 'wss://192.168.0.222:8089/ws'; //Websocket of your SIP Server
var sipConfig = { //Account config for the SIP Server
  uri      : 'sip:199@192.168.0.222',
  password : '199',
  realm : '192.168.0.222',
  'session_timers': false,
  contact_uri : "sip:199@192.168.0.222",
};
licodeServerUrl = 'https://192.168.0.222:3004/'; //The Licode Server URL
/* ---------------- */
/* ---------------- */
/* ---------------- */

var socket = new JsSIP.WebSocketInterface(WebSocketInterface);
sipConfig["sockets"] = [ socket ];

window.AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext = new AudioContext(); 

var sipPhones = [];
var connectedLicodeRooms = {};

var answerLstream = audioContext.createMediaStreamDestination();
var localLicodeStream;
var sipStream;

function createNewSipPhone() {
  var phoneLength = sipPhones.length;
  for(var i=0;i<phoneLength;i++) {
    if(sipPhones[i] && !sipPhones[i]["activeCall"]) { //Remove inactive phones
      myArray.splice(i, 1);
      i--;
      phoneLength--;
    }
  }

  var coolPhone = new JsSIP.UA(sipConfig);
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
    console.log("newRTCSession", data);
    var session = data.session; 
    if (session.direction === "incoming") { // incoming call here
      session.on("accepted",function(){ // the call has answered
        console.log("accepted");
        coolPhone["activeCall"] = true;
      });
      session.on("confirmed",function(){ // this handler will be called for incoming calls too
        console.log("confirmed");
        coolPhone["activeCall"] = true;
      });
      session.on("ended",function(){ // the call has ended
        console.log("ended");
        coolPhone["activeCall"] = false;
      });
      session.on("failed",function(e){ // unable to establish the call
        console.log("failed", e);
        coolPhone["activeCall"] = false;
      });

      var sipCallOptions = {
        mediaConstraints: {
          audio: true, // only audio calls
          video: false
        },
        pcConfig: {rtcpMuxPolicy: 'negotiate'},
        mediaStream : answerLstream.stream
      };

      // Answer call
      session.answer(sipCallOptions);

      session.connection.addEventListener('addstream', (e) => {
        console.log("Debug: addstream............", e.stream);

        var sipRoomnumber = session["_request"]["headers"]["Roomnumber"]["0"]["raw"];
        console.log("coolPhone",coolPhone);
        var licodeStreamOptions = { 
          audio: true, 
          video: false, 
          data: false
        };
        getLocalStream(licodeStreamOptions, function(localStream) {
          localLicodeStream = localStream;
          localStream.stream = e.stream;

          publishLocalStream(localStream, roomname, null, function(ret) {
            console.log(ret)
          });
        });       
      });
    }
  });
  coolPhone.start();

  sipPhones.push(coolPhone);
}
createNewSipPhone();

var roomname = "siproom";
var username = "test1";
$(document).ready(function() {
    connectToRoom(username, "presenter", roomname, 3838, function(roomEvent) { //roomConnectedCallback
      msg("roomConnectedCallback");
      var streams = roomEvent.streams;
      subscribeToStreams(roomname, streams, null);
    }, function(stream) { //streamAddedCallback
        msg("streamAddedCallback");
        var loop = true; //Enable to hear yourself (for testing)
        if((!localLicodeStream || stream.getID() != localLicodeStream.getID()) || loop) {
            subscribeToStreamByRoomnameAndStream(roomname, stream);
        }
    }, function(stream) { //streamSubscribed
      msg("streamSubscribed");
      if(stream.hasAudio()) { //Only audio streams
            var mediaStreamSource = audioContext.createMediaStreamSource( stream.stream );
            mediaStreamSource.connect(answerLstream);

            //Chrome stream is not playing without this next 3lines!!!
            var audioObj = document.createElement("AUDIO");
            audioObj.srcObject = stream.stream;
            audioObj = null;
      }
    }, function(stream) { //streamRemovedCallback
      msg("streamRemovedCallback");
      $("#streamcontainer").find("#video"+stream.getID()).remove();
    }, function() { //roomDisconnectedCallback
      msg("roomDisconnectedCallback");
    });
});

function msg(msg) {
  $("#messages").text($("#messages").text()+"\n"+msg)
}