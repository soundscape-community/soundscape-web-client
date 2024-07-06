<template>
  <nav>
    <input
      type="file"
      name="gpxFileInput"
      id="gpxFileInput"
      title="GPX file"
      @change="fileChanged" />
    <button
      class="nav-button"
      id="playPauseButton"
      title="Play/pause"
      @click="playPause"
    >
      {{ playing ? "⏸" : "▶" }}
    </button>
    <input
      type="range"
      name="pointSlider"
      title="Seek position"
      id="pointSlider"
      min="0"
      max="100"
      value="0"
      v-model="sliderPosition"
      @input="sliderInput"
    />

    <InputSpinner
      title="Speedup factor"
      :min="1" :max="9" :initial="5"
      :incAction="() => ++speedupFactor"
      :decAction="() => --speedupFactor"
    />

    <button
      class="nav-button"
      id="btn_clear"
      title="Clear cached data"
      @click="cache.clear"
    >
      &#128465;
    </button>
  </nav>
</template>

<script setup>
import InputSpinner from './InputSpinner.vue';
import cache from '../data/cache.js';
import { recentCallouts } from '../audio/sound.js';
import replayGPX from '../spatial/gpx.js';
import { inject, ref } from 'vue';

const audioQueue = inject('audioQueue');
const announcer = inject('announcer');
const locationProvider = inject('locationProvider');

const playing = ref(false);
const sliderPosition = ref(0);
const speedupFactor = ref(5);

let gpxPlayer = null;  // to be initialized on file selection

const fileChanged = (event) => {
  const file = event.target.files[0];

  if (file) {
    if (gpxPlayer && playing.value) {
      // Clear current playing file before loading new one
      playPause();
    }

    // Reset seek bar
    sliderPosition.value = 0;

    // Clear recent callout list
    recentCallouts.value = [];

    gpxPlayer = replayGPX(file, {
      // When GPX file has been loadedm trigger draw map at first point
      loadedCallback: (firstPoint) => locationProvider.updateLocation(firstPoint.lat, firstPoint.lon),
      // When GPX finishes playing, toggle to paused state and reset slider
      finishedCallback: () => {
        playPause();
        gpxPlayer.seekTo(0);
        gpxPlayer.updateSlider();
      },
      pointCallback: (point) => {
        locationProvider.updateOrientation(point.heading);
        locationProvider.updateLocation(point.lat, point.lon);

        // Update the slider when a new point is parsed
        gpxPlayer.updateSlider();
      },
      errorCallback: (error) => console.error("Error parsing GPX file:", error),
    });
  }
};

const playPause = () => {
  if (gpxPlayer) {
    // Read speed setting, and speed up speech proportionally
    gpxPlayer.speedupFactor = speedupFactor.value;
    audioQueue.setRate(speedupFactor.value);

    // Toggle play/pause
    if (!playing.value) {
      // Start triggering audio callouts
      locationProvider.events.addEventListener('locationUpdated', announcer.locationChanged)
      gpxPlayer.play();
      playing.value = true;
    } else {
      // Strop triggering audio callouts
      locationProvider.events.removeEventListener('locationUpdated', announcer.locationChanged);
      audioQueue.stopAndClear();
      gpxPlayer.pause();
      playing.value = false;
    }
  }
};

const sliderInput = () => {
  if (gpxPlayer) {
    // Calculate the index based on the slider value
    const totalPoints = gpxPlayer.trackPoints.length - 1;
    const newIndex = Math.round((sliderPosition.value / 100) * totalPoints);
    gpxPlayer.seekTo(newIndex);
  }
};
</script>