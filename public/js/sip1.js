var readyCallback = function(e){
            console.log("YO");

             createSipStack(); // see next section
        };
        var errorCallback = function(e){
            console.error('Failed to initialize the engine: ' + e.message);
        }
        SIPml.init(readyCallback, errorCallback);


        var sipStack;

            var registerSession;            
            function createSipStack(){
                sipStack = new SIPml.Stack({
                        realm: '192.168.0.144', // mandatory: domain name
                        impi: '199', // mandatory: authorization name (IMS Private Identity)
                        impu: 'sip:199@192.168.0.144', // mandatory: valid SIP Uri (IMS Public Identity)
                        password: 'asdg', // optional
                        display_name: '199', // optional
                        websocket_proxy_url: 'wss://192.168.0.144:8089/ws', // optional
                        //outbound_proxy_url: 'udp://example.org:5060', // optional
                        disable_video : true,
                        enable_rtcweb_breaker: false, // optional
                        disable_early_ims : true,
                        disable_debug : true,
                        enable_media_caching : true,
                        events_listener: { events: '*', listener: function(e) {
                            if(e.type == 'started'){
                                login();
                            }
                            else if(e.type == 'i_new_message'){ // incoming new SIP MESSAGE (SMS-like)
                                acceptMessage(e);
                            }
                            else if(e.type == 'i_new_call'){ // incoming audio/video call
                                acceptCall(e);
                            }
                        } }, // optional: '*' means all events
                        sip_headers: [ // optional
                                { name: 'User-Agent', value: 'IM-client/OMA1.0 sipML5-v1.0.0.0' },
                                { name: 'Organization', value: 'Doubango Telecom' }
                        ]
                    }
                );
            }
            

            
            var login = function(){
                registerSession = sipStack.newSession('register', {
                    events_listener: { events: '*', listener: function(e) {
                        console.info('session event = ' + e.type);
                    } } // optional: '*' means all events
                });
                registerSession.register();
            }

            var acceptCall = function(e){
                e.newSession.accept(); // e.newSession.reject() to reject the call
            }
            
            sipStack.start();