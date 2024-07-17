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

import { ref } from 'vue';
import { audioQueue } from '../state/audio.js';
import useAnnouncer from '../composables/announcer.js';
import { myLocation } from '../state/location.js';

const announcer = useAnnouncer();
const activeMode = ref(null);
var wakeLock = null;

// When mode button is clicked:
//   If a mode is currently active, end that mode
//   If mode button was different from current mode, start new mode
async function toggleMode(newMode) {
  // Clear queued audio
  if (activeMode.value) {
    audioQueue.stopAndClear();
    audioQueue.addToQueue({ soundUrl: mode_exit_wav });
  }

  // Remove any location and orientation change event handlers
  announcer.stopWatching()

  // Stop here if the intent was to end the current mode
  if (activeMode.value == newMode) {
    // exit current mode
    activeMode.value = null;

    if (wakeLock) {
      // Release the Wake Lock
      wakeLock.release().then(() => {
        wakeLock = null;
      });
    }

    return;
  }

  // enter new mode
  activeMode.value = newMode;

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
      break;

    case "near_me":
      announcer.calloutNearestRoad(
        myLocation.latitude, myLocation.longitude
      );
      announcer.calloutAllFeaturesOrSayNoneFound(
        myLocation.latitude, myLocation.longitude
      );
      break;
  }
};

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