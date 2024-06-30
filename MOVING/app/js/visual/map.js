// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

function createMap(id) {
  var map = L.map(id);

  // initialize OpenStreetMap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  // Create a custom divIcon with rotation
  var arrowIcon = L.divIcon({
    className: 'arrow-icon',
    iconSize: [0, 0], // set size to 0, as it's controlled by CSS
    iconAnchor: [7, 25] // adjust anchor based on the arrow design
  });

  var myLocationLayer = new L.LayerGroup().addTo(map);

  map.plotPoints = function(points, radiusMeters) {
    // Clear existing markers
    myLocationLayer.clearLayers();

    // Plot each point on the map
    points.forEach(function(point) {
      // Render a circle reflecting the radius of POIs within speaking distance
      L.circle([point.latitude, point.longitude], {
        color: 'red',
        fillColor: '#f03',
        fillOpacity: 0.3,
        radius: radiusMeters  // drawn radius is based on proximity threshold for callouts
      }).addTo(myLocationLayer);

      if (point.heading !== null && !isNaN(point.heading)) {
        // Also render a directional arrow showing inferred compass heading
        var arrowMarker = L.marker([point.latitude, point.longitude], {
          icon: arrowIcon,
        }).addTo(myLocationLayer);
        arrowMarker._icon.style.transform += ' rotate(' + point.heading + 'deg)';
      }
    });
  };

  map.plotMyLocation = function(locationProvider) {
    const lat = locationProvider.latitude;
    const lon = locationProvider.longitude;
    const head = locationProvider.heading;
    const radiusMeters = locationProvider.radiusMeters;
    // Don't try to plot points before location is available
    if (!isNaN(lat) && !isNaN(lon)) {
      map.plotPoints(
        [{ latitude: lat, longitude: lon, heading: head }],
        radiusMeters
      );
    }
  };

  // Render beacon marker in a separate layer, so it can be easily cleared.
  var beaconLayer = new L.LayerGroup().addTo(map);

  var beaconIcon = L.divIcon({
    className: 'beacon-icon',
    iconSize: [20, 20],
  });

  map.plotBeacon = function(lat, lon) {
    // Clear existing beacons
    beaconLayer.clearLayers();

    // Render a pulsing circle (see CSS)
    L.marker([lat, lon], {
      icon: beaconIcon,
    }).addTo(beaconLayer);
  };

  // Beacon pulses hwen it is active
  map.startBeaconPulse = function() {
    beaconLayer.eachLayer(layer => {
      layer.getElement().classList.add('pulsing');
    })
  };

  // Stop beacon pulsing whern it is inactive
  map.pauseBeaconPulse = function() {
    beaconLayer.eachLayer(layer => {
      layer.getElement().classList.remove('pulsing');
    })
  };

  return map;
}

export default createMap;