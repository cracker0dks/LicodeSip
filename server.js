var PORT = 8080;
var withHeadlessBrowser = true;

var https = require('https');
var express = require('express');
var fs = require("fs");
const puppeteer = require('puppeteer');

var app = express();

app.use(function(req, res, next) {
    "use strict";
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, DELETE');
    res.header('Access-Control-Allow-Headers', 'origin, content-type', 'X-Requested-With');
    if (req.method == 'OPTIONS') {
        res.send(200);
    } else {
        next();
    }
});

app.use(express.static(__dirname + '/public'));

var privateKey = fs.readFileSync( './cert/key.pem' );
var certificate = fs.readFileSync( './cert/cert.pem' );

var server = https.createServer({
    key: privateKey,
    cert: certificate
}, app).listen(PORT);

console.log("Server running on port:", PORT);

if(withHeadlessBrowser) {
	//Run a headless browser
	var url = "https://127.0.0.1:"+PORT+"/";
	(async () => {
	  const browser = await puppeteer.launch({
	  	"ignoreHTTPSErrors" : true
	  });
	  const page = await browser.newPage();
	  page.on('console', msg => {
		  for (let i = 0; i < msg.args().length; ++i) {
		  	console.log(`${i}: ${msg.args()[i]}`);
		  }
		});
	  await page.goto(url);

	  //await browser.close();
	})();
}