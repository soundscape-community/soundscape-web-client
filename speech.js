// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

const speechRate = 2.0;

function speakText(text) {
  // Check if the SpeechSynthesis API is available in the browser\
  if ('speechSynthesis' in window) {
    // Create a new SpeechSynthesisUtterance object
    var utterance = new SpeechSynthesisUtterance();
    utterance.text = text;
    utterance.rate = speechRate;

    // Use the default voice
    utterance.voice = speechSynthesis.getVoices()[0];

    //TODO spatial audio
    /*
    var audioContext = new (window.AudioContext || window.webkitAudioContext)();
    var panNode = audioContext.createStereoPanner();
    var source = audioContext.createMediaStreamSource(new MediaStream(audioContext.createMediaStreamDestination().stream));

    // Set the pan value to create a spatial audio effect
    panNode.pan.value = 1; // 1 for right, -1 for left

    utterance.onstart = function() {
      // Connect the SpeechSynthesisUtterance to the audio context
      speechSynthesis.speak(utterance);
      source.connect(panNode);
      panNode.connect(audioContext.destination);
    };

    utterance.onend = function() {
      // Disconnect the nodes when speech ends
      panNode.disconnect();
      source.disconnect();
      audioContext.close();
    };
    */

    // Speak the text
    logToPage(text);
    speechSynthesis.speak(utterance);
  } else {
    // SpeechSynthesis API not supported, provide a fallback
    alert('SpeechSynthesis is not supported in this browser. Please use a different browser.');
  }
}