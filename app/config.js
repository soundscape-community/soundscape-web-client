// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

const productionConfig = {
  tileServer: 'https://tiles.soundscape.services',
}

const testingConfig = {
  tileServer: 'http://localhost:8080/tiles',
}

// load appropriate config
const environment = window.location.hostname === 'soundscape-community.github.io' ? 'production' : 'testing';
const config = environment === 'production' ? productionConfig : testingConfig;

export default config;