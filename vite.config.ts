import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  root: './src',
  // Use relative paths for assets, since our Github Pages deploy is not at the root
  base: './',
  build: {
    outDir: '../dist',
    minify: false,
    emptyOutDir: true,
    rollupOptions: {
      // Build both the main site and the activity simulator as separate pages
      input: {
        index: './src/index.html',
        replay_gpx: './src/replay_gpx.html',
        help: './src/help.html'
      }
    }
  },
});
