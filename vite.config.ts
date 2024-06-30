import { defineConfig } from 'vite';

export default defineConfig({
  root: './src',
  build: {
    outDir: '../dist',
    minify: false,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: './src/index.html',
        replay_gpx: './src/replay_gpx.html',
      }
    }
  },
});
