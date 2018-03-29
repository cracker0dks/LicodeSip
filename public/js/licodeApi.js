//Licode API

var licodeServerUrl = 'https://192.168.0.222:3004/'; //default = '/socket/'
var socketPath = '/socket.io'; //default= '/socket.io'
 //
var licodeRooms={};

function getLocalStream(config, callback) {
  var localStream = Erizo.Stream(config);

  localStream.addEventListener('access-accepted', function () {
    console.log('Mic and Cam OK');  
    callback(localStream);
  });
  localStream.addEventListener('access-denied', function(event) {
    console.log("Access to webcam and/or microphone rejected");
    callback(false);
  });
  localStream.init();
}

function publishLocalStream(localStream, roomname, newMaxVideoBW, callback) {
  var maxVideoBW = newMaxVideoBW ? newMaxVideoBW : 300;
  if(licodeRooms[roomname]) {
    licodeRooms[roomname].publish(localStream, {maxVideoBW: maxVideoBW});
    callback(true);
  } else {
    callback("Not connected to the room: "+roomname+". First connect to this room!");
  }
}

function disconnectFromRoom(roomname) {
  licodeRooms[roomname].disconnect();
  licodeRooms[roomname] = null;
}

function connectToRoom(username, role, roomname, sipNumber, roomConnectedCallback, streamAddedCallback, streamSubscribed, streamRemovedCallback, roomDisconnectedCallback) {
  var roomData  = {username: username, role: role, room: roomname, sipNumber : sipNumber};
  createToken(roomData, function (response) {
    var token = response;
    licodeRooms[roomname] = Erizo.Room({token: token});
    licodeRooms[roomname]["sipNumber"] = sipNumber;

    licodeRooms[roomname].addEventListener('stream-added', function (streamEvent) {
      streamAddedCallback(streamEvent.stream);
        console.log('stream-added OK');
    });

    licodeRooms[roomname].addEventListener('stream-removed', function (streamEvent) {
        var stream = streamEvent.stream;
        streamRemovedCallback(stream)
        console.log("Stream Removed",stream.getID());
      });

    licodeRooms[roomname].addEventListener('stream-failed', function (){
      console.log('STREAM FAILED, DISCONNECTION');
      licodeRooms[roomname].disconnect();
      licodeRooms[roomname] = null;
    });

    licodeRooms[roomname].addEventListener('room-connected', function (roomEvent) {
      roomConnectedCallback(roomEvent);
        console.log('Connected to the room '+roomname+' OK');
    });

    licodeRooms[roomname].addEventListener('stream-subscribed', function(streamEvent) {
      streamSubscribed(streamEvent.stream)
        console.log('Subscribed to stream OK');
    });

    licodeRooms[roomname].addEventListener('room-disconnected', function() {
      roomDisconnectedCallback();
        console.log('disconnected from room');
    });

    licodeRooms[roomname].connect();
  });
}

function stopStream(roomname, username) {
  getStream(roomname, username, function(stream) {
    if(stream) {
      licodeRooms[roomname].unsubscribe(stream);
    }
  });
}

function getAlllicodeRooms(callback) {
  $.get( licodeServerUrl+"getRooms/", function( data ) {
    var alllicodeRooms = JSON.parse(data);
    callback(alllicodeRooms);
  });
}

function roomExist(roomname, callback) {
  getAlllicodeRooms( function(alllicodeRooms) {
    for(var i=0;i<alllicodeRooms.length;i++) {
      if(alllicodeRooms[i]["name"]==roomname) {
        callback(true);
        return;
      }
    }
    callback(false);
  });
}

function getStream(roomname, username, callback) {
  if(licodeRooms[roomname]) {
    licodeRooms[roomname].remoteStreams.forEach(function(stream) { 
      var streamAttr = stream.getAttributes();

      if(streamAttr && streamAttr["username"] == username) {
        callback(stream);
        return;
      } 
    })
  } else {
    callback(false);
  }
}

function subscribeToStreamByRoomnameAndStream(roomname, stream) {
  licodeRooms[roomname].subscribe(stream);
}

function subscribeToStreamByRoomAndUsername(roomname, username) {
  getStream(roomname, username, function(stream) {
    if(stream) {
      licodeRooms[roomname].subscribe(stream);
    } else {
      console.error("Room not found OR User Not found in room!");
    }
  });
}

function subscribeToStreams(roomname, streams, localStream){
  for (var index in streams) {
      var stream = streams[index];
      if (!localStream || localStream.getID() !== stream.getID()) {
        licodeRooms[roomname].subscribe(stream);
      }
  }
}


function createToken(body, callback) {
  var req = new XMLHttpRequest();
  var url = licodeServerUrl + 'createToken/';

  req.onreadystatechange = function () {
    if (req.readyState === 4) {
      callback(req.responseText);
    }
  };

  req.open('POST', url, true);
  req.setRequestHeader('Content-Type', 'application/json');
  req.send(JSON.stringify(body));
}