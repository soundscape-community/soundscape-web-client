// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

function createVoiceControls(audioQueue) {
  // Fetch available voices
  const voiceSelect = document.getElementById("voice");

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
    // Set voice to match initial form value
    audioQueue.setVoice(voiceSelect.value);
  })

  // Update voices when they change
  window.speechSynthesis.onvoiceschanged = function () {
    voiceSelect.innerHTML = ""; // Clear existing options
    populateVoices();
  };

  voiceSelect.addEventListener("change", function () {
    audioQueue.setVoice(voiceSelect.value);
  });
}

export default createVoiceControls;
