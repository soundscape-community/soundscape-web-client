// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

import { HeadingCalculator } from './heading.js'

const headingWindowSize = 5;  // number of recent points to use for estimating heading

function replayGPX(file, map, callbacks) {
  const {
    loadedCallback = () => {},
    finishedCallback = () => {},
    pointCallback = () => {},
    errorCallback = () => {}
  } = callbacks;

  let intervalId;
  let currentIndex = 0;
  let sliderValue = 0;

  const headingCalculator = new HeadingCalculator(headingWindowSize);

  let gpxPlayer = {
    speedupFactor: 1,
    trackPoints: [],

    getPointAtIndex: function(index) {
      const point = this.trackPoints[index];
      const lat = parseFloat(point.getAttribute("lat"));
      const lon = parseFloat(point.getAttribute("lon"));
      return { lat, lon };
    },

    getHeadingAtIndex: function(index) {
      // When seeking, compute heading by looking back, rather than using the running window.
      headingCalculator.resetPoints()
      let minIdx = Math.max(0, index - headingWindowSize);
      let maxIdx = Math.min(index, this.trackPoints.length - 1);
      for (let idx = minIdx; idx <= maxIdx; idx++) {
        let point = this.getPointAtIndex(idx);
        headingCalculator.addPoint(point.lat, point.lon);
      }
      return headingCalculator.computeHeading();
    },

    play: function() {
      intervalId = setInterval(() => {
        if (currentIndex < gpxPlayer.trackPoints.length) {
          const point = gpxPlayer.trackPoints[currentIndex];
          const lat = parseFloat(point.getAttribute("lat"));
          const lon = parseFloat(point.getAttribute("lon"));

          headingCalculator.addPoint(lat, lon);
          const heading = headingCalculator.computeHeading();

          map.setView([lat, lon], 16);

          pointCallback({ lat, lon, heading });
          currentIndex++;
        } else {
          this.pause(); // Stop playing when all points are processed
          finishedCallback();
        }
      }, 1000 / this.speedupFactor // Delay between points in milliseconds
      );
    },

    pause: function() {
      clearInterval(intervalId);
    },

    seekTo: function(index) {
      currentIndex = index;
      if (currentIndex < 0) {
        currentIndex = 0;
      } else if (currentIndex >= this.trackPoints.length) {
        currentIndex = this,trackPoints.length - 1;
      }

      let jumpPoint = this.getPointAtIndex(currentIndex);
      jumpPoint.heading = this.getHeadingAtIndex(currentIndex);
      pointCallback(jumpPoint);
    },

    updateSlider: function() {
      // Update the slider's value based on the current index
      const totalPoints = this.trackPoints.length - 1;
      sliderValue = (currentIndex / totalPoints) * 100;
      document.getElementById("pointSlider").value = sliderValue;
    },
  };

  const reader = new FileReader();
  reader.onload = function (e) {
    const gpxContent = e.target.result;
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(gpxContent, "text/xml");

    // Assuming that the GPX file structure follows a standard format
    gpxPlayer.trackPoints = xmlDoc.querySelectorAll("trkpt");

    // Trigger loadded callback with first point
    const firstPoint = gpxPlayer.getPointAtIndex(0);
    loadedCallback(firstPoint);
  };

  reader.onerror = function (e) {
    errorCallback(e.target.error);
  };

  reader.readAsText(file);

  return gpxPlayer;
}

export default replayGPX;