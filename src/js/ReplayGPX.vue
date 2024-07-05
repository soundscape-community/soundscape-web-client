<template>
  <nav>
    <input type="file" name="gpxFileInput" id="gpxFileInput" title="GPX file" />
    <button class="nav-button" id="playPauseButton" title="Play/pause">▶</button>
    <input type="range" name="pointSlider" title="Seek position" id="pointSlider" min="0" max="100" value="0" />
    <div id="rate" title="Speed-up factor">
      <button id="decreaseSpeed" title="Decrease speed-up factor">−</button>
      <div id="speedupFactor">5</div>
      <button id="increaseSpeed" title="Increase speed-up factor">+</button>
    </div>
    <button class="nav-button" id="btn_clear" title="Clear cached data">&#128465;</button>
  </nav>
  <main>
    <Map />
    <CalloutList />
  </main>
</template>

<script setup>
import CalloutList from './components/CalloutList.vue';
import Map from './components/Map.vue';
</script>