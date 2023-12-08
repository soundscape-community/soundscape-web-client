// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

const speechRate = 2.0;
const zoomLevel = 16;
const tileServer = 'https://tiles.soundscape.services'
//const tileServer = 'http://localhost:8080/tiles'

function logToPage(message) {
    // Create a new paragraph element
    var para = document.createElement("p");
    
    // Create a text node with the log message
    var node = document.createTextNode(message);
    
    // Append the text node to the paragraph element
    para.appendChild(node);
    
    // Append the paragraph element to the log container
    document.getElementById("log-container").appendChild(para);
  }

function speakText(text) {
    // Check if the SpeechSynthesis API is available in the browser\
    if ('speechSynthesis' in window) {
        // Create a new SpeechSynthesisUtterance object
        var utterance = new SpeechSynthesisUtterance();
        utterance.text = text;
        utterance.rate = speechRate;

        // Use the default voice
        utterance.voice = speechSynthesis.getVoices()[0];

        //TODO spatial audio
        /*
        var audioContext = new (window.AudioContext || window.webkitAudioContext)();
        var panNode = audioContext.createStereoPanner();
        var source = audioContext.createMediaStreamSource(new MediaStream(audioContext.createMediaStreamDestination().stream));

        // Set the pan value to create a spatial audio effect
        panNode.pan.value = 1; // 1 for right, -1 for left

        utterance.onstart = function() {
            // Connect the SpeechSynthesisUtterance to the audio context
            speechSynthesis.speak(utterance);
            source.connect(panNode);
            panNode.connect(audioContext.destination);
        };

        utterance.onend = function() {
            // Disconnect the nodes when speech ends
            panNode.disconnect();
            source.disconnect();
            audioContext.close();
        };
        */

        // Speak the text
        logToPage(text);
        speechSynthesis.speak(utterance);
    } else {
        // SpeechSynthesis API not supported, provide a fallback
        alert('SpeechSynthesis is not supported in this browser. Please use a different browser.');
    }
}

// Function to create a half-kilometer bounding box around a point
function createBoundingBox(latitude, longitude) {
    // Create a Turf.js point
    const point = turf.point([longitude, latitude]);
  
    // Buffer the point with a radius of 0.5 km
    const buffered = turf.buffer(point, 0.5, { units: 'kilometers' });
  
    // Extract the bounding box coordinates
    const bbox = turf.bbox(buffered);
  
    return bbox;
}

// Function to convert latitude and longitude to Mercator tile coordinates
function latLonToTileCoords(latitude, longitude, zoom) {
    const tileSize = 256; // Standard size for Mercator tiles
    const scale = 1 << zoom;
    const worldSize = tileSize * scale;
  
    const x = Math.floor((longitude + 180) / 360 * scale);
    const y = Math.floor((1 - Math.log(Math.tan(latitude * Math.PI / 180) + 1 / Math.cos(latitude * Math.PI / 180)) / Math.PI) / 2 * scale);
  
    return { x, y, z: zoom };
}

// Function to enumerate all Mercator tiles within a bounding box
function enumerateTilesInBoundingBox(bbox, minZoom, maxZoom) {
    const tiles = [];
  
    for (let zoom = minZoom; zoom <= maxZoom; zoom++) {
      const topLeft = latLonToTileCoords(bbox[3], bbox[0], zoom);
      const bottomRight = latLonToTileCoords(bbox[1], bbox[2], zoom);
  
      for (let x = topLeft.x; x <= bottomRight.x; x++) {
        for (let y = topLeft.y; y <= bottomRight.y; y++) {
          tiles.push({ x, y, z: zoom });
        }
      }
    }
  
    return tiles;
}


function getLocation(callback) {
    // Get the user's location
    logToPage("Getting your location...")
    if (navigator.geolocation) {
        // The navigator.geolocation object is available
        navigator.geolocation.getCurrentPosition(
        // Success callback
        function (position) {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
    
            console.log('Latitude:' + latitude);
            console.log('Longitude:' + longitude);

            callback(latitude, longitude);
        },
        // Error callback
        function (error) {
            switch (error.code) {
            case error.PERMISSION_DENIED:
                console.error('User denied the request for Geolocation.');
                break;
            case error.POSITION_UNAVAILABLE:
                console.error('Location information is unavailable.');
                break;
            case error.TIMEOUT:
                console.error('The request to get user location timed out.');
                break;
            case error.UNKNOWN_ERROR:
                console.error('An unknown error occurred.');
                break;
            }
        }
        );
    } else {
        // Geolocation is not supported by the browser
        console.error('Geolocation is not supported by this browser.');
    }
}


function friendlyDistance(pointA, pointB) {
    // Use feet or miles, depending on how far away the point is.
    var units = 'feet';
    var value = turf.distance(pointA, pointB, { units: units }).toFixed(0);
    if (value > 2000) {
        units = 'miles'
        var value = turf.distance(pointA, pointB, { units: units }).toFixed(1);
    }
    return { value, units };
}


function vocalize(latitude, longitude) {
    // Create bounding box
    const boundingBox = createBoundingBox(latitude, longitude);
    console.log('Bounding Box:', boundingBox);

    // Enumerate all tiles within that box
    const tiles = enumerateTilesInBoundingBox(boundingBox, zoomLevel, zoomLevel);
    console.log('Mercator Tiles:', tiles);

    // Pick one tile to fetch
    const tile = tiles[0];
    fetch(`${tileServer}/${tile.z}/${tile.x}/${tile.y}.json`)
        .then(response => response.json())
        .then(data => {
            console.log('Fetched tile:', data);

            data.features.forEach(feature => {
                // Call out things that have names that aren't roads
                if (feature.properties.name && feature.feature_type != 'highway') {
                    // Calculate the distance between the GeoJSON feature and the point
                    const distance = friendlyDistance(
                        turf.centroid(feature),
                        turf.point([longitude, latitude]),
                    );
                    speakText(feature.properties.name + ' is ' + distance.value + ' ' + distance.units + ' away');
                }
            })
        }
    );        
}
