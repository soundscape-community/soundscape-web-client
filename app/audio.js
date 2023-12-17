// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const speechRate = 2.0;

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
  return new Promise((resolve) => {
    const source = audioContext.createBufferSource();
    source.buffer = buffer;

    source.connect(audioContext.destination);
    source.onended = () => resolve();
    source.start();
  });
}

// Function to play synthesized speech
function playSpeech(text) {
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speechRate;
    utterance.onend = () => resolve();
    speechSynthesis.speak(utterance);
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