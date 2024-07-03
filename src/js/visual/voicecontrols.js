// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

function createVoiceControls(audioQueue) {
  // Fetch available voices
  const voiceSelect = document.getElementById("voice");
  // const rateInput = document.getElementById('rate');
  const decreaseRate = document.getElementById("decreaseRate");
  const increaseRate = document.getElementById("increaseRate");
  const rateValue = document.getElementById("rateValue");

  // Populate voice selector
  async function populateVoices() {
    // Populate voice list with all English voices
    return audioQueue.loadVoices().then((voices) => {
      // Remove them to avoid duplicates
      while (voiceSelect.childNodes[0] != null) {
        voiceSelect.childNodes[0].remove();
      }

      audioQueue.voices.forEach(function (voice, index) {
        const option = document.createElement("option");
        option.value = index;
        option.textContent = "🗣 " + voice.name;
        voiceSelect.appendChild(option);
      });
    });
  }

  populateVoices().then(() => {
    // Set voice and rate to match initial form values
    audioQueue.setRate(parseFloat(rateValue.textContent));
    audioQueue.setVoice(voiceSelect.value);
  });

  // Android Webview doesn have speechSynthesis 
  // (and the capacitor plugin @capacitor-community / text - to - speech" doesn't support onvoiceschanged. )
  if (window.speechSynthesis) {
    // Update voices when they change
    window.speechSynthesis.onvoiceschanged = function () {
      voiceSelect.innerHTML = ""; // Clear existing options
      populateVoices();
    };
  }

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
}

export default createVoiceControls;
