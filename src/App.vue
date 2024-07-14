<template>
  <router-view></router-view>
</template>

<script setup>
</script>

<style>
main {
  padding: 15px;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

/* Top button bar */
nav {
  display: flex;
  justify-content: space-between; /* Adjust alignment of elements */
  align-items: center;
  background-color: #2c3e50;
  color: white;
  padding: 15px;
  overflow-x: hidden; /* Prevent horizontal scrolling */
}

.nav-button,
.beacon-button,
nav input,
nav select {
  background-color: #e74c3c;
  color: #fff;
  border: none;
  padding: 10px; /* Decrease padding */
  border-radius: 8px;
  cursor: pointer;
  font-size: 1em; /* Adjust font size */
}

nav input,
nav select {
  max-width: 30%; /* on replay_gpx, don't let file selector/slider get too big */
}
</style>