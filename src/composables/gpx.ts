// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

import { useDirectionOfTravel } from '../composables/compass'

const headingWindowSize = 5;  // number of recent points to use for estimating heading

interface GPXPoint {
  lat: number;
  lon: number;
  heading?: number | null;
}

interface GPXCallbacks {
  loadedCallback: (firstPoint: GPXPoint) => any;
  finishedCallback: () => any;
  pointCallback: (point: GPXPoint) => any;
  errorCallback: (e: Error) => any;
}

export interface GPXPlayer {
  speedupFactor: number;
  trackPoints: NodeListOf<Element>;

  getPointAtIndex: (index: number) => GPXPoint;
  getHeadingAtIndex: (index: number) => number | null;
  play: () => void;
  pause: () => void;
  seekTo: (index: number) => void;
  updateSlider: () => void;
}

export function useGPX(file: File, callbacks: GPXCallbacks) {
  let intervalId: number;
  let currentIndex = 0;
  let sliderValue = 0;

  const headingCalculator = useDirectionOfTravel(headingWindowSize);

  let gpxPlayer: GPXPlayer = {
    speedupFactor: 1,
    trackPoints: document.querySelectorAll('nonexistent'),  // empty NodeList

    getPointAtIndex: function(index: number): { lat: number, lon: number } {
      const point = this.trackPoints[index];
      const lat = parseFloat(point.getAttribute("lat")!);
      const lon = parseFloat(point.getAttribute("lon")!);
      return { lat, lon };
    },

    getHeadingAtIndex: function(index: number): number | null {
      // When seeking, compute heading by looking back, rather than using the running window.
      headingCalculator.resetPoints()
      let minIdx = Math.max(0, index - headingWindowSize);
      let maxIdx = Math.min(index, this.trackPoints.length - 1);
      for (let idx = minIdx; idx <= maxIdx; idx++) {
        let { lat, lon } = this.getPointAtIndex(idx);
        headingCalculator.addPoint(lat, lon);
      }
      return headingCalculator.computeHeading();
    },

    play: function() {
      intervalId = window.setInterval(() => {
        if (currentIndex < gpxPlayer.trackPoints.length) {
          const { lat, lon } = this.getPointAtIndex(currentIndex);

          headingCalculator.addPoint(lat, lon);
          const heading = headingCalculator.computeHeading();

          callbacks.pointCallback({ lat, lon, heading });
          currentIndex++;
        } else {
          this.pause(); // Stop playing when all points are processed
          callbacks.finishedCallback();
        }
      }, 1000 / this.speedupFactor // Delay between points in milliseconds
      );
    },

    pause: function() {
      window.clearInterval(intervalId);
    },

    seekTo: function(index: number) {
      currentIndex = index;
      if (currentIndex < 0) {
        currentIndex = 0;
      } else if (currentIndex >= this.trackPoints.length) {
        currentIndex = this.trackPoints.length - 1;
      }

      let jumpPoint = this.getPointAtIndex(currentIndex);
      Object.assign(jumpPoint, { heading: this.getHeadingAtIndex(currentIndex) });
      callbacks.pointCallback(jumpPoint);
    },

    updateSlider: function() {
      // Update the slider's value based on the current index
      const totalPoints = this.trackPoints.length - 1;
      sliderValue = (currentIndex / totalPoints) * 100;
    },
  };

  const reader = new FileReader();
  reader.onload = function (e: ProgressEvent<FileReader>) {
    const gpxContent = e.target!.result as string;
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(gpxContent, "text/xml");

    // Assuming that the GPX file structure follows a standard format
    gpxPlayer.trackPoints = xmlDoc.querySelectorAll("trkpt");

    // Trigger loadded callback with first point
    const firstPoint = gpxPlayer.getPointAtIndex(0);
    callbacks.loadedCallback(firstPoint);
  };

  reader.onerror = function (e: ProgressEvent<FileReader>) {
    callbacks.errorCallback(e.target!.error!);
  };

  reader.readAsText(file);

  return gpxPlayer;
}

export default useGPX;