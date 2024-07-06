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
      input: {
        index: './src/index.html',
        help: './src/help.html'
      }
    }
  },
});
