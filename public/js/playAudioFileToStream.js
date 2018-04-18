function playAudioFileToStream(filename, destination) {
	var getSound = new XMLHttpRequest(); // Load the Sound with XMLHttpRequest
	getSound.open("GET", "/audio/"+filename, true); // Path to Audio File
	getSound.responseType = "arraybuffer"; // Read as Binary Data
	getSound.onload = function() {
		audioContext.decodeAudioData(getSound.response, function(buffer){
			var playSound = audioContext.createBufferSource(); // Declare a New Sound
			playSound.buffer = buffer; // Attatch our Audio Data as it's Buffer
			playSound.connect(destination);  // Link the Sound to the Output
			playSound.start(0); // Play the Sound Immediately
		});
	}
	getSound.send(); // Send the Request and Load the File
}