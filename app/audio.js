// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const speechRate = 2.0;

// Variables to store the current sound and speech sources
let currentSoundSource = null;
let currentSpeechSource = null;

function logToPage(message) {
  // Create a new paragraph element
  var para = document.createElement("p");

  // Create a text node with the log message
  var node = document.createTextNode(message);

  // Append the text node to the paragraph element
  para.appendChild(node);

  // Append the paragraph element to the log container
  document.getElementById("log-container").appendChild(para);
}

// Function to load a sound file
async function loadSound(url) {
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return await audioContext.decodeAudioData(arrayBuffer);
  } catch (error) {
    console.error('Error loading sound:', error);
  }
}

// Function to play a sound
function playSound(buffer) {
  // Cancel the current sound source if any
  if (currentSoundSource) {
    currentSoundSource.stop();
  }

  return new Promise((resolve) => {
    const source = audioContext.createBufferSource();
    source.buffer = buffer;

    source.connect(audioContext.destination);
    source.onended = () => resolve();
    source.start();

    // Update the current sound source
    currentSoundSource = source;
  });
}

// Function to play synthesized speech
function playSpeech(text) {
  // Cancel the current speech source if any
  if (currentSpeechSource) {
    speechSynthesis.cancel();
  }

  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speechRate;
    utterance.onend = () => resolve();
    logToPage(text);
    speechSynthesis.speak(utterance);

    // Update the current speech source
    currentSpeechSource = utterance;
  });
}

// Function to create a player with a dynamic sequence of sounds and speech
export function createPlayer() {
  const player = {
    queue: [],
    isPlaying: false,
    addToQueue(item) {
      player.queue.push(item);
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

    if (typeof currentItem === 'string') {
      // If it's a string, assume it's a sound file URL
      const soundBuffer = await loadSound(currentItem);
      await playSound(soundBuffer);
    } else if (typeof currentItem === 'object' && currentItem.text) {
      // If it's an object with a 'text' property, assume it's speech
      await playSpeech(currentItem.text);
    }

    // Play the next item recursively
    playNext();
  }

  return player;
}