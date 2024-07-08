<template>
  <button
    class="nav-button"
    id="btn_callouts"
    title="Start tracking"
    :class="activeMode == 'callouts' ? 'active' : ''"
    @click="toggleMode('callouts')"
  >
    <i class='fas'>&#xf124;</i>
  </button>
  <button
    class="nav-button"
    id="btn_near_me"
    title="Announce places near me"
    :class="activeMode == 'near_me' ? 'active' : ''"
    @click="toggleMode('near_me')"
  >
    ⓘ
  </button>
</template>

<script setup>
import mode_exit_wav from "/assets/sounds/mode_exit.wav";
import mode_enter_wav from "/assets/sounds/mode_enter.wav";

import { inject, ref, watch } from 'vue';
import { playSpatialSpeech } from '../utils/sound.js';

const props = defineProps({
  tracker: Object,
});

const announcer = inject('announcer');
const audioQueue = inject('audioQueue');

const activeMode = ref(null);
var wakeLock = null;

// When mode button is clicked:
//   If a mode is currently active, end that mode
//   If mode button was different from current mode, start new mode
function toggleMode(newMode) {
  // required for iOS Safari: first speech must be directly triggered by user action
  playSpatialSpeech(" ");

  if (activeMode.value == newMode) {
    // exit current mode
    activeMode.value = null;
  } else {
    // enter new mode
    activeMode.value = newMode;
  }
}

watch(activeMode, async (newMode, oldMode) => {
  // Clear queued audio
  if (oldMode) {
    audioQueue.stopAndClear();
    audioQueue.addToQueue({ soundUrl: mode_exit_wav });
  }

  // Remove any location and orientation change event handlers
  announcer.stopWatching()
  props.tracker.stop();

  // Stop here if the intent was to end the current mode
  if (!newMode) {
    if (wakeLock) {
      // Release the Wake Lock
      wakeLock.release().then(() => {
        wakeLock = null;
      });
    }

    return;
  }

  // Request a Wake Lock
  if ("wakeLock" in navigator && !wakeLock) {
    try {
      wakeLock = await navigator.wakeLock.request("screen");
      console.log("Wake Lock is active!");

      // Listen for Wake Lock being released
      //   (when no active modes OR when page loses focus)
      wakeLock.addEventListener("release", () => {
        console.log("Wake Lock released.");
      });
    } catch (err) {
      // The Wake Lock request has failed - usually system related, such as battery.
      console.log(err);
    }
  }

  // play mode-enter sound
  audioQueue.addToQueue({ soundUrl: mode_enter_wav });

  switch (newMode) {
    case "callouts":
      announcer.startWatching();
      props.tracker.start();
      break;

    case "near_me":
      props.tracker.current()
        .then((coords) => {
          announcer.calloutNearestRoad(coords.latitude, coords.longitude);
          announcer.calloutAllFeaturesOrSayNoneFound(coords.latitude, coords.longitude);
        })
      break;
  }
});

// Reacquire Wake Lock when page regains focus
document.addEventListener("visibilitychange", async () => {
  if (wakeLock !== null && document.visibilityState === "visible") {
    wakeLock = await navigator.wakeLock.request("screen");
    console.log("Wake Lock reacquired.");
  }
});
</script>

<style scoped>
button {
  background-color: #e74c3c;
}

button.active {
  background-color: #18b3c3;
}
</style>