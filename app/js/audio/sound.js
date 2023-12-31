// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const speechRate = 2.0;

// Variables to store the current sound and speech sources
let currentSoundSource = null;
let currentSpeechSource = null;

// Fetch and decode each sound effect only once, and store here by URL
let audioBufferCache = {};

// iOS Safari: need to load voices before speech synthesis will work
// https://stackoverflow.com/a/61963317
let _speechSynth
let _voices
const _cache = {}
function loadVoicesWhenAvailable (onComplete = () => {}) {
  _speechSynth = window.speechSynthesis
  const voices = _speechSynth.getVoices()

  if (voices.length !== 0) {
    _voices = voices
    onComplete()
  } else {
    return setTimeout(function () { loadVoicesWhenAvailable(onComplete) }, 100)
  }
}
function getVoices (locale) {
  if (!_speechSynth) {
    throw new Error('Browser does not support speech synthesis')
  }
  if (_cache[locale]) return _cache[locale]

  _cache[locale] = _voices.filter(voice => voice.lang === locale)
  return _cache[locale]
}
loadVoicesWhenAvailable(function () {
  console.log(`Loaded ${_voices.length} TTS voices.`);
});

// Function to load a sound file
async function loadSound(url) {
  if (!audioBufferCache[url]) {
    // fetch sound URL, decode, and store buffer in cache
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      audioBufferCache[url] = await audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
      console.error('Error loading sound:', error);
      return;
    }
  }
  return audioBufferCache[url];
}

// Function to create a spatial audio source
function createSpatialSource(buffer, x, y) {
  const source = audioContext.createBufferSource();
  const panner = audioContext.createPanner();

  // Set the position of the audio source in 3D space
  panner.setPosition(x, y, 0);

  // Connect the source to the panner and the panner to the audio context's destination
  source.connect(panner);
  panner.connect(audioContext.destination);

  source.buffer = buffer;
  return source;
}

// Function to play a sound with spatial audio
function playSpatialSound(buffer, x, y) {
  // Cancel the current sound source if any
  if (currentSoundSource) {
    currentSoundSource.stop();
  }

  return new Promise((resolve) => {
    const spatialSource = createSpatialSource(buffer, x, y);
    spatialSource.onended = () => resolve();
    spatialSource.start();

    // Update the current sound source
    currentSoundSource = spatialSource;
  });
}

// Function to play synthesized speech with spatial audio
//FIXME not actually spatial
function playSpatialSpeech(text, x, y) {
  // Cancel the current speech source if any
  if (currentSpeechSource) {
    speechSynthesis.cancel();
  }

  return new Promise((resolve) => {
    const voices = getVoices('en-US');
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speechRate;
    utterance.voice = voices[0];
    utterance.onend = () => resolve();
    speechSynthesis.speak(utterance);

    // Update the current speech source
    currentSpeechSource = utterance;
  });
}

// Function to create a player with a dynamic sequence of spatial sounds and spatial speech
export function createSpatialPlayer(locationProvider) {
  const player = {
    queue: [],
    isPlaying: false,
    locationProvider: locationProvider,
    addToQueue(item) {
      player.queue.push(item);
      //console.log(item);
      if (!player.isPlaying) {
        player.isPlaying = true;
        playNext();
      }
    },
    stopAndClear() {
      // Stop audio and clear the queue
      player.queue = [];
      player.isPlaying = false;

      // Cancel the current sound and speech sources
      if (currentSoundSource) {
        currentSoundSource.stop();
      }
      if (currentSpeechSource) {
        speechSynthesis.cancel();
      }
    },
  };

  async function playNext() {
    if (player.queue.length === 0) {
      player.isPlaying = false;
      return; // Nothing left in the queue
    }

    const currentItem = player.queue.shift();

    // Calculate the Cartesian coordinates to position the audio.
    // (done just before the audio is spoken, since the user may have
    // moved since the audio was queued)
    var relativePosition = {x: 0, y: 0};
    if (currentItem.location) {
      relativePosition = player.locationProvider.relativePosition(currentItem.location);
    }

    // Compute current distance to POI (may be greater than proximityThreshold, if user has moved away since it was queued)
    if (currentItem.includeDistance) {
      const units = 'feet';
      const distance = player.locationProvider.distance(currentItem.location, { units: units }).toFixed(0);
      currentItem.text += `, ${distance} ${units}`
    }

    if (typeof currentItem === 'object' && currentItem.soundUrl) {
      // If it's an object with a 'soundUrl' property, assume it's a spatial sound
      const soundBuffer = await loadSound(currentItem.soundUrl);
      await playSpatialSound(soundBuffer, relativePosition.x || 0, relativePosition.y || 0);
    } else if (typeof currentItem === 'object' && currentItem.text) {
      // If it's an object with a 'text' property, assume it's spatial speech
      await playSpatialSpeech(currentItem.text, relativePosition.x || 0, relativePosition.y || 0);
    } else {
      console.error(`unrecognized object in audio queue: ${currentItem}`)
    }

    // Play the next item recursively
    playNext();
  }

  return player;
}