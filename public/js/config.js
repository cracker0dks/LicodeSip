/* ---------------- */
/* ---- CONFIG ---- */
/* ---------------- */
var WebSocketInterface = 'wss://192.168.0.222:8089/ws'; //Websocket of your SIP Server
var sipConfig = { //Account config for the SIP Server
  uri      : 'sip:licodebridge@192.168.0.222',
  password : 'password',
  realm : '192.168.0.222',
  'session_timers': false,
  contact_uri : "sip:licodebridge@192.168.0.222",
};
licodeServerUrl = 'https://192.168.0.222:3004/'; //The Licode Server URL
socketPath = '/socket.io'; //default= '/socket.io' (Licode socket path)

var loop = false; //For debugging set to true to hear yourself (echo)
/* ---------------- */
/* ---------------- */
/* ---------------- */