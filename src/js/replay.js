// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

import { createApp } from 'vue';
import GPXReplay from './components/GPXReplay.vue';

import { createSpatialPlayer } from './audio/sound.js'
import createCalloutAnnouncer from './audio/callout.js';
import createLocationProvider from './spatial/location.js'

// Actions to take when page is rendered in full
document.addEventListener('DOMContentLoaded', function () {
  const locationProvider = createLocationProvider();
  const audioQueue = createSpatialPlayer(locationProvider);
  const announcer = createCalloutAnnouncer(audioQueue);

  audioQueue.loadVoices();

  const app = createApp(GPXReplay);
  app.provide('audioQueue', audioQueue);
  app.provide('announcer', announcer);
  app.provide('locationProvider', locationProvider);
  app.mount('body');
});