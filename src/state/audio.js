// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

import { ref } from 'vue';
import { TextToSpeech } from "@capacitor-community/text-to-speech";
import unmute from "../vendor/unmute.js";
import { normalizedRelativePositionTo, distanceTo } from '../state/location.js';

export var audioContext = null;
export var audioQueue = null;

export const initializeAudioQueue = () => {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();

  // iOS Safari workaround to allow audio while mute switch is on
  let allowBackgroundPlayback = true;
  let forceIOSBehavior = false;
  unmute(audioContext, allowBackgroundPlayback, forceIOSBehavior);

  audioQueue = createSpatialPlayer();
  audioQueue.loadVoices();
};

// Use a Vue ref for recent callouts list so that changes trigger UI updates
export const recentCallouts = ref([]);

// Variables to store the current sound and speech sources
let currentSoundSource = null;
// let currentSpeechSource = null;

// Fetch and decode each sound effect only once, and store here by URL
let audioBufferCache = {};

// Function to load a sound file
async function loadSound(url) {
  if (!audioBufferCache[url]) {
    // fetch sound URL, decode, and store buffer in cache
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      audioBufferCache[url] = await audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
      console.error("Error loading sound:", error);
      return;
    }
  }
  return audioBufferCache[url];
}

// Function to create a spatial audio source
function createSpatialSource(buffer, x, y) {
  const source = audioContext.createBufferSource();
  const panner = createPanner(audioContext);

  // Set the position of the audio source in 3D space
  panner.setCoordinates(x, y);

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
export async function playSpatialSpeech(text, voice, rate, x, y) {
  // Cancel the current speech source if any
  TextToSpeech.stop();

  return TextToSpeech.speak({
    text,
    voice: typeof voice !== "undefined" ? voice.voiceIndex : voice,
    rate,
  });
}

// Function to create a player with a dynamic sequence of spatial sounds and spatial speech
export function createSpatialPlayer() {
  const player = {
    queue: [],
    isPlaying: false,

    // Speech synthesis customization
    voices: null,
    voice: null,
    rate: 2,
    setVoice(voiceIndex) {
      player.voice = player.voices[voiceIndex];
    },
    setRate(rate) {
      player.rate = rate;
    },
    increaseRate() {
      return ++player.rate;
    },
    decreaseRate() {
      return --player.rate;
    },

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
      TextToSpeech.stop();
    },

    async loadVoices() {
      // Build list of available voices
      return TextToSpeech.getSupportedVoices().then((voices) => {
        // add "voiceIndex" as it is required by the TextToSpeech.speak
        voices.voices.forEach(function (voice, index) {
          voice.voiceIndex = index;
        });

        const voicesEn = voices.voices.filter((voice) =>
          voice.lang.startsWith("en")
        );
        const voicesNames = new Set(voicesEn.map((voice) => voice.name));

        player.voices = Array.from(voicesNames).map((name) =>
          voicesEn.find((voice) => voice.name === name)
        );

        // Select the system default voice by default
        const systemDefaultVoice = player.voices.find((voice) => voice.default) || 0;
        player.setVoice(systemDefaultVoice);

        return player.voices;
      });
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
    var relativePosition = { x: 0, y: 0 };
    if (currentItem.location) {
      relativePosition = normalizedRelativePositionTo.value(
        currentItem.location
      );
    }

    // Compute current distance to POI (may be greater than proximityThreshold, if user has moved away since it was queued)
    var textToSpeak = currentItem.text;
    if (currentItem.includeDistance) {
      const units = "feet";
      const distance = distanceTo.value(currentItem.location, { units: units })
        .toFixed(0);
      textToSpeak += `, ${distance} ${units}`;
    }

    if (typeof currentItem === "object" && currentItem.soundUrl) {
      // If it's an object with a 'soundUrl' property, assume it's a spatial sound
      const soundBuffer = await loadSound(currentItem.soundUrl);
      await playSpatialSound(
        soundBuffer,
        relativePosition.x || 0,
        relativePosition.y || 0
      );
    } else if (typeof currentItem === "object" && currentItem.text) {
      // If it's an object with a 'text' property, assume it's spatial speech
      if (currentItem.location) {
        // Visual list will update with callouts as they are announced
        recentCallouts.value.unshift(currentItem);
      }
      await playSpatialSpeech(
        textToSpeak,
        player.voice,
        player.rate,
        relativePosition.x || 0,
        relativePosition.y || 0
      );
    } else {
      console.error(`unrecognized object in audio queue: ${currentItem}`);
    }

    // Play the next item recursively
    playNext();
  }

  return player;
}

// Create a WebAudio panner with the settings that will be used by both
// beacons and callouts.
// https://developer.mozilla.org/en-US/docs/Web/API/PannerNode
export function createPanner(audioContext) {
  const panner = audioContext.createPanner();
  panner.panningModel = "HRTF";
  // Keep a constant volume regardless of distance from source.
  panner.distanceModel = "inverse";
  panner.refDistance = 1;
  panner.maxDistance = 1;
  panner.rolloffFactor = 1;
  // Ignore the direction the source is pointing.
  panner.coneInnerAngle = 360;
  panner.coneOuterAngle = 0;
  panner.coneOuterGain = 0;

  panner.setCoordinates = (x, y) => {
    panner.positionX.value = x;
    // Note that the panner's axes are *not* the same axes as ours,
    // namely that Y is up/down, and Z is forward/backward.
    panner.positionY.value = 0;
    panner.positionZ.value = y;
  };

  return panner;
}