// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT
import { createApp } from 'vue';
import App from './components/App.vue';

import unmute from "./vendor/unmute.js";
import {
  audioContext,
  createSpatialPlayer,
} from "./audio/sound.js";
import createCalloutAnnouncer from "./audio/callout.js";

// Actions to take when page is rendered in full
document.addEventListener("DOMContentLoaded", function () {
  const audioQueue = createSpatialPlayer();
  const announcer = createCalloutAnnouncer(audioQueue);

  audioQueue.loadVoices();

  const app = createApp(App);
  app.provide('announcer', announcer);
  app.provide('audioQueue', audioQueue);
  app.mount('body');

  // iOS Safari workaround to allow audio while mute switch is on
  let allowBackgroundPlayback = true;
  let forceIOSBehavior = false;
  unmute(audioContext, allowBackgroundPlayback, forceIOSBehavior);
});