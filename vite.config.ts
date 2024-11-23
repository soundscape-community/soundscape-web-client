import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    vue(),
    tsconfigPaths(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,

      pwaAssets: {
        disabled: false,
        config: true,
      },

      manifest: {
        name: "Soundscape web client",
        short_name: "Simplescape",
        start_url: "index.html",
        background_color: "#000000",
        theme_color: "#000000",
        display: "standalone",
        description: "Soundscape web",
      },

      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
      },

      devOptions: {
        enabled: false,
        navigateFallback: 'index.html',
        suppressWarnings: true,
        type: 'module',
      },
    })
  ],
  // root: './src',
  // Use relative paths for assets, since our Github Pages deploy is not at the root
  resolve: {
    alias: {
      '#vendor': 'src/vendor'
    }
  },
  assetsInclude: ['**/*.wav'],
  base: './',
  build: {
    outDir: './dist',
    minify: false,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: 'index.html',
      }
    }
  },
});
