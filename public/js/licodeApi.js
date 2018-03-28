//Licode API

var licodeServerUrl = 'https://192.168.0.222:3004/'; //default = '/socket/'
var socketPath = '/socket.io'; //default= '/socket.io'
 //
var rooms={};

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
  if(rooms[roomname]) {
    rooms[roomname].publish(localStream, {maxVideoBW: maxVideoBW});
    callback(true);
  } else {
    callback("Not connected to the room: "+roomname+". First connect to this room!");
  }
}

function disconnectFromRoom(roomname) {
  rooms[roomname].disconnect();
  rooms[roomname] = null;
}

function connectToRoom(username, role, roomname, sipNumber, roomConnectedCallback, streamAddedCallback, streamSubscribed, streamRemovedCallback, roomDisconnectedCallback) {
  var roomData  = {username: username, role: role, room: roomname, sipNumber : sipNumber};
  createToken(roomData, function (response) {
    var token = response;
    rooms[roomname] = Erizo.Room({token: token});

    rooms[roomname].addEventListener('stream-added', function (streamEvent) {
      streamAddedCallback(streamEvent.stream);
        console.log('stream-added OK');
    });

    rooms[roomname].addEventListener('stream-removed', function (streamEvent) {
        var stream = streamEvent.stream;
        streamRemovedCallback(stream)
        console.log("Stream Removed",stream.getID());
      });

    rooms[roomname].addEventListener('stream-failed', function (){
      console.log('STREAM FAILED, DISCONNECTION');
      rooms[roomname].disconnect();
      rooms[roomname] = null;
    });

    rooms[roomname].addEventListener('room-connected', function (roomEvent) {
      roomConnectedCallback(roomEvent);
        console.log('Connected to the room '+roomname+' OK');
    });

    rooms[roomname].addEventListener('stream-subscribed', function(streamEvent) {
      streamSubscribed(streamEvent.stream)
        console.log('Subscribed to stream OK');
    });

    rooms[roomname].addEventListener('room-disconnected', function() {
      roomDisconnectedCallback();
        console.log('disconnected from room');
    });

    rooms[roomname].connect();
  });
}

function stopStream(roomname, username) {
  getStream(roomname, username, function(stream) {
    if(stream) {
      rooms[roomname].unsubscribe(stream);
      $('#video' +stream.getID()).remove();
    }
  });
}

function getAllRooms(callback) {
  $.get( licodeServerUrl+"getRooms/", function( data ) {
    var allRooms = JSON.parse(data);
    callback(allRooms);
  });
}

function roomExist(roomname, callback) {
  getAllRooms( function(allRooms) {
    for(var i=0;i<allRooms.length;i++) {
      if(allRooms[i]["name"]==roomname) {
        callback(true);
        return;
      }
    }
    callback(false);
  });
}

function getStream(roomname, username, callback) {
  if(rooms[roomname]) {
    rooms[roomname].remoteStreams.forEach(function(stream) { 
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
  rooms[roomname].subscribe(stream);
}

function subscribeToStreamByRoomAndUsername(roomname, username) {
  getStream(roomname, username, function(stream) {
    if(stream) {
      rooms[roomname].subscribe(stream);
    } else {
      console.error("Room not found OR User Not found in room!");
    }
  });
}

function subscribeToStreams(roomname, streams, localStream){
  for (var index in streams) {
      var stream = streams[index];
      if (!localStream || localStream.getID() !== stream.getID()) {
        rooms[roomname].subscribe(stream);
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