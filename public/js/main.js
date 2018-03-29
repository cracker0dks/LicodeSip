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
var sipUserCnt = 0;

var answerLstream 
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
  coolPhone["connectedLicodeStreams"] = [];
  coolPhone["licodeToSipStream"] = audioContext.createMediaStreamDestination();

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
    var session = data.session;
    coolPhone["sipRoomnumber"] = session["_request"]["headers"]["Roomnumber"]["0"]["raw"];  //Header was set at SIP Server, take a look at AsteriskConfig/extensions.conf
    console.log("sipRoomnumber", coolPhone["sipRoomnumber"]);

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
        mediaStream : coolPhone["licodeToSipStream"].stream
      };

      // Answer call
      session.answer(sipCallOptions);

      session.connection.addEventListener('addstream', (e) => {
        console.log("Debug: addstream............");

        var licodeStreamOptions = { 
          audio: true, 
          video: false, 
          data: false
        };
        getLocalStream(licodeStreamOptions, function(sipToLicodeStream) {
          sipToLicodeStream.stream = e.stream;
          publishSipStreamToLicodeRoom(coolPhone["sipRoomnumber"], sipToLicodeStream, function(err) {
            if(err) {
              console.error("failed to publish sip stream to licode room! No Sip room found for Number:",coolPhone["sipRoomnumber"]);
              /* add some fail sound here */
              session.terminate(); //Terminate session! (cancle call)
            }
          });
          
        });       
      });
    }
  });
  coolPhone.start();

  sipPhones.push(coolPhone);
}
createNewSipPhone();

function publishSipStreamToLicodeRoom(sipRoomnumber, sipTolicodeStream, callback) {
  for(var i in licodeRooms) {
    if(licodeRooms[i]["sipNumber"] == sipRoomnumber) {
      publishLocalStream(sipTolicodeStream, i, null, function(ret) {
        console.log("Published sipTolicodeStream!", ret)
        callback(false);
      });
      return;
    }
  }

  //Not connected to this rooms so connect first
  getAlllicodeRooms(function(rooms) {
    console.log(rooms);
    var foundSipRoom = false;
    for(var i=0;i<rooms.length;i++) {
      if(rooms[i]["data"]["sipNumber"] == sipRoomnumber) { //Room found
        foundSipRoom = true;
        (function() {
          var roomname = rooms[i]["name"];
          connectToRoom("sipuser"+(++sipUserCnt), "presenter", roomname, sipRoomnumber, function(roomEvent) { //roomConnectedCallback

            msg("roomConnectedCallback");
            var streams = roomEvent.streams;
            subscribeToStreams(roomname, streams, null); //Connect to streams already in room

            publishLocalStream(sipTolicodeStream, roomname, null, function(ret) {
              console.log("Published sipTolicodeStream!", ret)
              callback(false);
            });

          }, function(stream) { //streamAddedCallback

            msg("streamAddedCallback");
            subscribeToStreamByRoomnameAndStream(roomname, stream);

          }, function(stream) { //streamSubscribed
            msg("streamSubscribed");
            if(stream.hasVideo()) {
              //Dont do shit on video!
            } else if(stream.hasAudio()) { //Only audio streams

              for(var i=0;i<sipPhones.length;i++) { //Check all phones
                if(sipPhones[i]["sipRoomnumber"]==sipRoomnumber) { //Phone is connected to this room
                  var streamConnected = false;
                  for(var k=0;k<sipPhones[i]["connectedLicodeStreams"].length;k++) {
                    if(sipPhones[i]["connectedLicodeStreams"][k] == stream.getID()) { //Phone is already connected to this stream
                      streamConnected = true;
                      break;
                    }
                  }
                  if(!streamConnected) { //Stream not (yet) connected
                    var loop = false; //For debugging set to true to hear yourself
                    if(loop || sipTolicodeStream.getID() != stream.getID()) {
                      var mediaStreamSource = audioContext.createMediaStreamSource( stream.stream );
                      mediaStreamSource.connect(sipPhones[i]["licodeToSipStream"]);
                      
                      //Chrome stream is not playing without this next 3lines!!!
                      var audioObj = document.createElement("AUDIO");
                      audioObj.srcObject = stream.stream;
                      audioObj = null;
                    }
                  }
                }
              }
            }
          }, function(stream) { //streamRemovedCallback
            msg("streamRemovedCallback");
          }, function() { //roomDisconnectedCallback
            delete licodeRoomStreams[sipRoomnumber];
            msg("roomDisconnectedCallback");
          });
        })();
      }
    }
    callback(!foundSipRoom);
  });
}

function msg(msg) {
  $("#messages").text($("#messages").text()+"\n"+msg)
}