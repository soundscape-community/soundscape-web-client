<template>
  <nav>
    <MainModeSelector />
    <VoiceSelector />
    <InputSpinner
      title="Speaking rate"
      :min="1" :max="5" :initial="audioQueue.rate"
      :incAction="audioQueue.increaseRate"
      :decAction="audioQueue.decreaseRate"
    />
    <button class="nav-button">
      <RouterLink :to="{name: 'Help'}">
        <i class="fas fa-question" style="color: white;"></i>
      </RouterLink>
    </button>
  </nav>

  <main>
    <MapDisplay
      :location="myLocation"
      :beacon="beacon"
    />
    <CalloutList :callouts="recentCallouts" />
  </main>
</template>

<script setup lang="ts">
import CalloutList from '../components/CalloutList.vue';
import InputSpinner from '../components/InputSpinner.vue';
import MainModeSelector from '../components/MainModeSelector.vue';
import MapDisplay from '../components/MapDisplay.vue';
import VoiceSelector from '../components/VoiceSelector.vue';
import { beacon } from '../state/beacon';
import { myLocation } from '../state/location';
import { audioQueue, recentCallouts } from '../state/audio';
import { onMounted, ref } from 'vue';

interface MainViewProps {
  lat: string;
  lon: string;
}
const props = defineProps<MainViewProps>();

onMounted(() => {
  // Use fixed location if user specified URL parameters.
  if (props.lat && props.lon) {
    myLocation.setLocation(
      parseFloat(props.lat),
      parseFloat(props.lon),
    );
    // Compass points at mouse pointer
    const mapLocation = document.getElementById("map")!;
    window.addEventListener('mousemove', (event) => {
      const angle = getMouseAngle(mapLocation, event);
      myLocation.setHeading(angle);
    });
  }
});

// For testing, let heading follow mouse pointer
function getMouseAngle(node: Element, event: MouseEvent) {
  // Get the node's bounding rectangle
  const rect = node.getBoundingClientRect();

  // Calculate the center of the node
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  // Calculate the position of the mouse relative to the center of the node
  const mouseX = event.clientX - centerX;
  const mouseY = event.clientY - centerY;

  // Calculate the angle in radians
  const angleRadians = Math.atan2(mouseX, -mouseY);

  // Convert the angle to degrees
  const angleDegrees = angleRadians * (180 / Math.PI);

  return angleDegrees;
}
</script>