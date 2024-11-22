// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

import { Feature, Point } from 'geojson';
import { ref } from 'vue';
import { SpeechSynthesisVoice, TextToSpeech } from "@capacitor-community/text-to-speech";
import unmute from "@vendor/unmute.js";
import { normalizedRelativePositionTo, distanceTo } from '../state/location';

export var audioContext: AudioContext;
export var audioQueue: SpatialPlayer;

export const initializeAudioQueue = () => {
  if ('AudioContext' in window) {
    audioContext = new AudioContext();
  } else if ('webkitAudioContext' in window) {
    audioContext = new (window as any).webkitAudioContext();
  } else {
    throw new Error('AudioContext is not supported in this browser.');
  }

  // iOS Safari workaround to allow audio while mute switch is on
  let allowBackgroundPlayback = true;
  let forceIOSBehavior = false;
  unmute(audioContext, allowBackgroundPlayback, forceIOSBehavior);

  audioQueue = createSpatialPlayer();
  audioQueue.loadVoices();
};

// Use a Vue ref for recent callouts list so that changes trigger UI updates
export const recentCallouts = ref<QueuedSpeech[]>([]);

// Variables to store the current sound and speech sources
let currentSoundSource: AudioBufferSourceNode;
// let currentSpeechSource = null;

// Fetch and decode each sound effect only once, and store here by URL
interface AudioDictionary {
  [key: string]: AudioBuffer;
}
let audioBufferCache: AudioDictionary = {};

// Function to load a sound file
async function loadSound(url: string): Promise<AudioBuffer> {
  if (!audioBufferCache[url]) {
    // fetch sound URL, decode, and store buffer in cache
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    audioBufferCache[url] = await audioContext.decodeAudioData(arrayBuffer);
  }
  return audioBufferCache[url];
}

// Function to create a spatial audio source
function createSpatialSource(buffer: AudioBuffer, x: number, y: number): AudioBufferSourceNode {
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
function playSpatialSound(buffer: AudioBuffer, x: number, y: number) {
  // Cancel the current sound source if any
  if (currentSoundSource) {
    currentSoundSource.stop();
  }

  return new Promise<void>((resolve) => {
    const spatialSource = createSpatialSource(buffer, x, y);
    spatialSource.onended = () => resolve();
    spatialSource.start();

    // Update the current sound source
    currentSoundSource = spatialSource;
  });
}

// Function to play synthesized speech with spatial audio
//FIXME not actually spatial
export async function playSpatialSpeech(text: string, voiceIndex: number, rate: number, x: number, y: number) {
  // Cancel the current speech source if any
  TextToSpeech.stop();

  return TextToSpeech.speak({
    text,
    voice: voiceIndex,
    rate,
  });
}

export type SpeechSynthesisVoiceWithIndex = SpeechSynthesisVoice & {
  voiceIndex: number;
}

interface QueuedEffect {
  soundUrl: string;
  location?: Feature<Point>;
}
export interface QueuedSpeech {
  text: string;
  location?: Feature<Point>;
  includeDistance?: boolean;
}
type QueueItem = QueuedEffect | QueuedSpeech;

interface SpatialPlayer {
  queue: QueueItem[];
  isPlaying: boolean;
  voices: SpeechSynthesisVoiceWithIndex[] | null;
  voice: SpeechSynthesisVoiceWithIndex | null;
  rate: number;
  setVoice: (voiceIndex: number) => void;
  setRate: (rate: number) => void;
  increaseRate: () => number;
  decreaseRate: () => number;
  addToQueue: (item: QueueItem) => void;
  stopAndClear: () => void;
  loadVoices: () => Promise<SpeechSynthesisVoiceWithIndex[]>;
}

// Function to create a player with a dynamic sequence of spatial sounds and spatial speech
export function createSpatialPlayer(): SpatialPlayer {
  const player: SpatialPlayer = {
    queue: [],
    isPlaying: false,

    // Speech synthesis customization
    voices: null,
    voice: null,
    rate: 2,
    setVoice(voiceIndex: number) {
      if (player.voices) {
        player.voice = player.voices[voiceIndex];
      }
    },
    setRate(rate: number) {
      player.rate = rate;
    },
    increaseRate() {
      return ++player.rate;
    },
    decreaseRate() {
      return --player.rate;
    },

    addToQueue(item: QueueItem) {
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

    async loadVoices(): Promise<SpeechSynthesisVoiceWithIndex[]> {
      // Build list of available voices
      let voices = await TextToSpeech.getSupportedVoices();

      player.voices = voices.voices.filter((voice) =>
        voice.lang.startsWith("en")
      ).map((voice, index) =>
        // add "voiceIndex" as it is required by the TextToSpeech.speak
        Object.assign(voice, {voiceIndex: index})
      );

      // Select the system default voice by default
      const systemDefaultVoice = player.voices.find((voice) => voice.default);
      if (systemDefaultVoice) {
        player.setVoice(systemDefaultVoice.voiceIndex);
      } else {
        player.setVoice(0);
      }

      return player.voices;
    },
  };

  async function playNext(): Promise<void> {
    const currentItem = player.queue.shift();
    if (!currentItem) {
      player.isPlaying = false;
      return; // Nothing left in the queue
    }

    // Calculate the Cartesian coordinates to position the audio.
    // (done just before the audio is spoken, since the user may have
    // moved since the audio was queued)
    var relativePosition = { x: 0, y: 0 };
    if (currentItem.location) {
      relativePosition = normalizedRelativePositionTo.value(
        currentItem.location
      );
    }

    if ('soundUrl' in currentItem) {
      // If it's an object with a 'soundUrl' property, assume it's a spatial sound
      const soundBuffer = await loadSound(currentItem.soundUrl);
      await playSpatialSound(
        soundBuffer,
        relativePosition.x || 0,
        relativePosition.y || 0
      );
    } else {
      // Compute current distance to POI (may be greater than proximityThreshold, if user has moved away since it was queued)
      var textToSpeak = currentItem.text || '';
      if (currentItem.includeDistance && currentItem.location) {
        const units = "feet";
        const distance = distanceTo.value(currentItem.location, { units: units })
          .toFixed(0);
        textToSpeak += `, ${distance} ${units}`;
      }

      // If it's an object with a 'text' property, assume it's spatial speech
      if (currentItem.location) {
        // Visual list will update with callouts as they are announced
        recentCallouts.value.unshift(currentItem);
      }
      await playSpatialSpeech(
        textToSpeak,
        player.voice ? player.voice.voiceIndex : 0,
        player.rate,
        relativePosition.x || 0,
        relativePosition.y || 0
      );
    }

    // Play the next item recursively
    playNext();
  }

  return player;
}

// Create a WebAudio panner with the settings that will be used by both
// beacons and callouts.
// https://developer.mozilla.org/en-US/docs/Web/API/PannerNode
export type PannerNodeWithCoordinates = PannerNode & {
  setCoordinates: (x: number, y: number) => void;
}
export function createPanner(audioContext: AudioContext): PannerNodeWithCoordinates {
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

  const setCoordinates = (x: number, y: number): void => {
    panner.positionX.value = x;
    // Note that the panner's axes are *not* the same axes as ours,
    // namely that Y is up/down, and Z is forward/backward.
    panner.positionY.value = 0;
    panner.positionZ.value = y;
  };

  return Object.assign(panner, { setCoordinates });
}