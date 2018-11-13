# Licode <==> Sip Bridge
The aim of this project is to enable Licode conferences like always, but you can join with phones through a SIP provider aswell.

![asd](/doc/arch.png)
## Info
This a proof of concept (atm) and still very beta so do NOT run it in production. Needs a lot more testing!

## Some Facts:
1. Bridge is not limitted to an amount of SIP Calls
2. The bridge is working like multible SIP clients and can be connected to any SIP Server supported by jssip: http://jssip.net/documentation/misc/interoperability/
3. Bridge using the chromium WebRTC stack and is running in a Headless browser

## Flow of the Application
1. Bridge register on the SIP Server as normal SipClient
2. Phone calls SIP Server with a number like "123" (Take a look at the example config /AstersikConfig)
2. Phone is asked to enter the roomnumber with DTMF (Phonekeys).
2. SIP Server redirects call to the SIP client started by this bridge
3. Bridge search for a LicodeRoom with the attribute: sipNumber = entered number from the Phone
4. Only go on if room with sipNumber exist. Else cancle call (Astersik will tell the phone that the room not exist)
5. Connect all streams from the Licode Room to the SipClient
6. Connect the Sip Stream to the Licode Room
7. Connect new streams incoming to the Licode Room to the SipClient

Note: You can also remove the sipNumber input request from your SIP Server (Step 3)... in this case the bridge will ask the user to enter the number (via. DTMF). In this case you have to be sure that your SIP Server sets DTMF Mode to "info" for the bridge. (jssip.js does not support inband)

## Installation
1. Change your licode Server to set sipNumber as attribute to your rooms (example https://github.com/cracker0dks/ezLicode/blob/master/basicServer.js)
2. Config your Sip server as shown at /AstersikConfig
3. Clone this repo
4. Install node for your system
4. run: `npm i` to install all deps
5. open: /public/js/config.js and change the SipClient and Licode Server config...
6. run: `node server.js`

You should get: 

```
Server running on port: 8083
0: JSHandle:connected!
0: JSHandle:registered!
```
This means the Bridge SipClient connected correctly to your Sip Provider (server).

Now just call the "sipNumber" (123 for this example), and be sure to enter a vaild sipRoomnumber

## Troubleshooting
* Be sure a Licode Room with the correct sipNumber exist
    * Surf to https://yourLicodeServerIp:3004/getRooms for basic example to get all rooms with attributes
* For debugging you can set loop=true at /public/js/main.js to hear yourself (echo) on the phone. Your voice will go like: Phone->SipServer->Bridge->Licode->Bridge->SipServer->Phone
* To debug the bridge you can also set "withHeadlessBrowser" (at server.js) to false, restart the server and surf with your chrome to https://yourBridgeServerIp:8083 also be sure to allow all selfSigned Certificates. Check the console for errors 
* Be sure that the SIP Server is supporting Websocket, Opus and RTC connections. To see a working configuration or host your own SIP Server, look at /AstersikConfig
* Be sure to run pjsip on the SIP Server
