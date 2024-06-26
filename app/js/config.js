// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

const productionConfig = {
  tileServer: 'https://tiles.soundscape.services',
}

const testingConfig = {
  tileServer: "/tiles",
};

// load appropriate config
const environment = typeof window !== 'undefined' && window.location.hostname === 'soundscape-community.github.io' ? 'production' : 'testing';
const config = environment === 'production' ? productionConfig : testingConfig;

export default config;