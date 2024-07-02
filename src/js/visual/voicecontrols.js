// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT
import { TextToSpeech } from "@capacitor-community/text-to-speech";

function createVoiceControls(audioQueue) {
  // Fetch available voices
  const voiceSelect = document.getElementById("voice");
  // const rateInput = document.getElementById('rate');
  const decreaseRate = document.getElementById("decreaseRate");
  const increaseRate = document.getElementById("increaseRate");
  const rateValue = document.getElementById("rateValue");

  // Just for testing
  // TextToSpeech.speak({
  //   text: "This is a sample text.",
  //   lang: "en-US",
  //   rate: 1.0,
  //   pitch: 1.0,
  //   volume: 1.0,
  //   category: "ambient",
  // });

  // Populate voice selector
  function populateVoices() {
    // Populate voice list with all English voices
    audioQueue.voices = [];

    TextToSpeech.getSupportedVoices().then((voices) => {
      // add "voiceIndex" as it is required by the TextToSpeech.speak
      voices.voices.forEach(function (voice, index) {
        voice.voiceIndex = index;
      });

      const voicesEn = voices.voices.filter((voice) =>
        voice.lang.startsWith("en")
      );
      const voicesNames = new Set(voicesEn.map((voice) => voice.name));

      audioQueue.voices = Array.from(voicesNames).map((name) =>
        voicesEn.find((voice) => voice.name === name)
      );

      // Remove them to avoid duplicates
      while (voiceSelect.childNodes[0] != null) {
        voiceSelect.childNodes[0].remove();
      }

      // console.log(`I'll add ${audioQueue.voices.length} voices to the list`);
      audioQueue.voices.forEach(function (voice, index) {
        const option = document.createElement("option");
        option.value = index;
        option.textContent = "🗣 " + voice.name;
        voiceSelect.appendChild(option);

        console.log(`VOICE ${voice.name} with value ${index} APPENDED`);
      });
      // set initial voice
      audioQueue.setVoice(voiceSelect.value);
    });
  }
  populateVoices();

  // Select the system default voice by default
  const systemDefaultVoice = audioQueue.voices.find((voice) => voice.default);
  if (systemDefaultVoice) {
    voiceSelect.value = audioQueue.voices.indexOf(systemDefaultVoice);
  }

  // Update voices when they change
  window.speechSynthesis.onvoiceschanged = function () {
    voiceSelect.innerHTML = ""; // Clear existing options
    populateVoices();
  };

  // Update voice and rate when user changes them
  decreaseRate.addEventListener("click", function (e) {
    rateValue.textContent = audioQueue.decreaseRate();
  });

  increaseRate.addEventListener("click", function (e) {
    rateValue.textContent = audioQueue.increaseRate();
  });

  voiceSelect.addEventListener("change", function () {
    audioQueue.setVoice(voiceSelect.value);
  });

  // Set voice and rate to match initial form values
  audioQueue.setRate(parseFloat(rateValue.textContent));
  audioQueue.setVoice(voiceSelect.value);
}

export default createVoiceControls;
