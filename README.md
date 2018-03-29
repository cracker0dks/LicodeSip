# Licode <==> Sip Bridge
The aim of this project is to enable Licode conferences like always, but you can join with phones through a SIP provider aswell.

![asd](/doc/arch.png)

## Some Facts:
1. This is still beta so do not run in production. Needs a lot more testing!
2. Bridge is not limitted to an amount of SIP Calls
2. Called Number desides to witch Licode Room your Phone connects
2. The bridge is working like a single SIP client and can be connected to any SIP Server supported by jssip: http://jssip.net/documentation/misc/interoperability/
3. Bridge using the chromium WebRTC stack and is running in a Headless browser

## Flow of the Application
1. Bridge register on the SIP Server as normal SipClient
2. Phone calls SIP Server with a number like "1234567656" (Must be equal to a sipNumber from a room on the Licode Server)
2. SIP Server redirects call to the SIP client started by this bridge
3. Bridge search for a LicodeRoom with the attribute: sipNumber = 1234567656
4. Only go on if room with sipNumber exist
5. Connect all streams from the Licode Room to the SipClient
6. Connect the Sip Stream to the Licode Room
7. Connect new streams incoming to the Licode Room to the SipClient

## Installation
1. Change your licode Server to set sipNumber as attribute to your rooms (example https://github.com/cracker0dks/ezLicode/blob/master/basicServer.js)
3. Clone this repo
4. Install node for your system
4. run: `npm i` to install all deps
5. open: /public/js/main.js and change the SipClient and Licode Server config...
6. run: `node server.js`

You should get: 

```
Server running on port: 8083
0: JSHandle:connected!
0: JSHandle:registered!
```
This means the Bridge SipClient connected correctly to your Sip Provider (server).

Now just call the "sipNumber" and be sure your bridge Sip client gets the number you set to the LicodeRoom from your SIP provider.

## Troubleshooting
* Be sure a Licode Room with the correct sipNumber exist
    * Surf to https://yourLicodeServerIp:3004/getRooms for basic example to get all rooms with attributes
* To debug the bridge you can also set "withHeadlessBrowser" (at server.js) to false, restart the server and surf with your chrome to https://yourBridgeServerIp:8083 also be sure to allow all selfSigned Certificates. Check the console for errors 
* Be sure that the SIP Server is supporting Websocket, Opus and RTC connections. To see a working configuration or host your own SIP Server, look at /AstersikConfig
* Be sure to run pjsip on the SIP Server
