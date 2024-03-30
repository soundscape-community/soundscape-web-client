// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

function createVoiceControls(audioQueue) {
  // Fetch available voices
  const voiceSelect = document.getElementById('voice');
  // const rateInput = document.getElementById('rate');
  const decreaseRate = document.getElementById('decreaseRate');
  const increaseRate = document.getElementById('increaseRate');
  const rateValue = document.getElementById('rateValue');

  // Populate voice selector
  function populateVoices() {
    // Populate voice list with all English voices
    audioQueue.voices = window.speechSynthesis.getVoices()
      .filter(voice => voice.lang.startsWith('en'));;
    audioQueue.voices.forEach(function(voice, index) {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = '🗣 ' + voice.name;
      voiceSelect.appendChild(option);
    });
  }
  populateVoices();

  // Select the system default voice by default
  const systemDefaultVoice = audioQueue.voices.find(voice => voice.default);
  if (systemDefaultVoice) {
    voiceSelect.value = audioQueue.voices.indexOf(systemDefaultVoice);
  }

  // Update voices when they change
  window.speechSynthesis.onvoiceschanged = function() {
    voiceSelect.innerHTML = ''; // Clear existing options
    populateVoices();
  };

  // Update voice and rate when user changes them
  decreaseRate.addEventListener("click", function (e) {
    rateValue.textContent = audioQueue.decreaseRate();
  });

  increaseRate.addEventListener("click", function (e) {
    rateValue.textContent = audioQueue.increaseRate();
  });

  voiceSelect.addEventListener('change', function() {
    audioQueue.setVoice(voiceSelect.value);
  });

  // Set voice and rate to match initial form values
  audioQueue.setRate(parseFloat(rateValue.textContent));
  audioQueue.setVoice(voiceSelect.value);
}

export default createVoiceControls;
