// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT
import { createApp } from 'vue';
import Main from './components/Main.vue';

import unmute from "./vendor/unmute.js";
import {
  audioContext,
  createSpatialPlayer,
} from "./audio/sound.js";
import createCalloutAnnouncer from "./audio/callout.js";
import createLocationProvider from "./spatial/location.js";

// Actions to take when page is rendered in full
document.addEventListener("DOMContentLoaded", function () {
  const locationProvider = createLocationProvider();
  const audioQueue = createSpatialPlayer(locationProvider);
  const announcer = createCalloutAnnouncer(audioQueue);

  const app = createApp(Main);
  app.provide('announcer', announcer);
  app.provide('audioQueue', audioQueue);
  app.provide('locationProvider', locationProvider);
  app.mount('body');

  // iOS Safari workaround to allow audio while mute switch is on
  let allowBackgroundPlayback = true;
  let forceIOSBehavior = false;
  unmute(audioContext, allowBackgroundPlayback, forceIOSBehavior);
});