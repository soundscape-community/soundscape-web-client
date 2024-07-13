// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT
import { createApp } from 'vue';
import App from './App.vue';

import unmute from "./vendor/unmute.js";
import {
  audioContext,
  audioQueue,
} from "./utils/sound.js";

// Actions to take when page is rendered in full
document.addEventListener("DOMContentLoaded", function () {
  audioQueue.loadVoices();

  const app = createApp(App);
  app.mount('body');

  // iOS Safari workaround to allow audio while mute switch is on
  let allowBackgroundPlayback = true;
  let forceIOSBehavior = false;
  unmute(audioContext, allowBackgroundPlayback, forceIOSBehavior);
});