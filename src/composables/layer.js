import { watch, onMounted, onBeforeUnmount, reactive } from 'vue';
import L from 'leaflet';

// Create a custom divIcon with rotation
var arrowIcon = L.divIcon({
  className: 'arrow-icon',
  iconSize: [0, 0],
  iconAnchor: [12, 30],
});

export function useReactiveMapLayer(map, reactivePoint, options) {
  let layer;
  let drawnYet = false;

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
      L.marker(
        [reactivePoint.latitude, reactivePoint.longitude],
        {
          icon: L.divIcon({
            className: options.className,
            iconSize: options.iconSize
          })
        }
      ).addTo(layer);
`
      // Move the map view if we should follow the point, or if this is the first value
      // of the point we've seen.`
      if (options.follow || (options.setMapView && !drawnYet)) {
        map.value.setView([reactivePoint.latitude, reactivePoint.longitude], 16);
        drawnYet = true;
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

  // Beacon pulses when it is active
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