import { watch, onMounted, onBeforeUnmount, reactive } from 'vue';
import L from 'leaflet';

// Create a custom divIcon with rotation
var arrowIcon = L.divIcon({
  className: 'arrow-icon',
  iconSize: [0, 0],
  iconAnchor: [12, 30],
});

export function useReactiveMapLayer(map, reactivePoint, follow, createMarker) {
  let layer;

  const initializeLayer = () => {
    layer = L.layerGroup().addTo(map.value);
    updateLayer();
  };

  const updateLayer = () => {
    if (!reactivePoint || !layer) {
      return;
    }

    // Render point as marker
    layer.clearLayers();
    if (reactivePoint.latitude && reactivePoint.longitude) {
      createMarker(reactivePoint).addTo(layer);
      if (follow) {
        map.value.setView([reactivePoint.latitude, reactivePoint.longitude], 16);
      }
    }

    // Start/stop beacon pulse
    if (reactivePoint.enabled !== 'undefined') {
      reactivePoint.enabled ? startPulse() : pausePulse();
    }

    if (reactivePoint.heading !== null && !isNaN(reactivePoint.heading)) {
      // Also render a directional arrow showing inferred compass heading
      var arrowMarker = L.marker([reactivePoint.latitude, reactivePoint.longitude], {
        icon: arrowIcon,
      }).addTo(layer);
      arrowMarker._icon.style.transform += ' rotate(' + reactivePoint.heading + 'deg)';
    }
  };

  // Beacon pulses hwen it is active
  const startPulse = () => {
    layer.eachLayer(l => {
      l.getElement().classList.add('pulsing');
    });
  };

  // Stop beacon pulsing when it is inactive
  const pausePulse = () => {
    layer.eachLayer(l => {
      l.getElement().classList.remove('pulsing');
    });
  };

  onMounted(() => {
    initializeLayer();
    watch(reactivePoint, updateLayer, { deep: true });
  });

  onBeforeUnmount(() => {
    if (layer) {
      map.value.removeLayer(layer);
    }
  });
}