// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT
import { createApp } from 'vue';
import App from './App.vue';
import router from './router/index';

// Actions to take when page is rendered in full
document.addEventListener("DOMContentLoaded", function () {
  const app = createApp(App);
  app.use(router);
  app.mount('body');
});