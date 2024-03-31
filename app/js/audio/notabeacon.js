// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

// This file is called "notabeacon.js" because "beacon.js" is blocked by some ad blockers.

import { point } from '@turf/turf';

const onCourseAngle = 30;  // degrees +/- Y axis
const foundProximityMeters = 10;  // proximity to auto-stop beacon
const announceEveryMetters = 50;

export function createBeacon(latitude, longitude, locationProvider, audioQueue) {
  const sourceLocation = point([longitude, latitude]);
  var relativePosition = locationProvider.normalizedRelativePosition(sourceLocation);
  var lastAnnouncedDistance = null;

  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const panner = audioContext.createPanner();

  // For smooth transitions between "on" and "off" beacons, we keep two audio elements
  // constantly looping, and selectively mute one or the other.
  const onCourse = new Audio( 'app/sounds/beacons/Classic/Classic_OnAxis.wav');
  const offCourse = new Audio('app/sounds/beacons/Classic/Classic_OffAxis.wav');
  onCourse.loop = true;
  onCourse.muted = true;
  offCourse.loop = true;

  const onCourseSource = audioContext.createMediaElementSource(onCourse);
  const offCourseSource = audioContext.createMediaElementSource(offCourse);
  onCourseSource.connect(panner);
  offCourseSource.connect(panner);
  panner.connect(audioContext.destination);

  var beacon = {
    start: () => {
      onCourse.play();
      offCourse.play();
    },
    stop: () => {
      onCourse.pause();
      offCourse.pause();
    },
    recomputePosition: () => {
      relativePosition = locationProvider.normalizedRelativePosition(sourceLocation);
      panner.setPosition(relativePosition.x, relativePosition.y, 0);
    },
  };

  // Reevaluate beacon state at most once per audio loop
  // "ended" event is not triggered by looped audio, so approximate restart based on time
  onCourse.addEventListener('timeupdate', () => {
    if (onCourse.currentTime < 0.1) {
      const distanceMeters = locationProvider.distance(sourceLocation, { units: "meters" });
      if (distanceMeters < foundProximityMeters) {
        // Beacon found -- stop the audio
        beacon.stop();
        new Audio('app/sounds/SS_beaconFound2_48k.wav').play();
      } else if (Math.abs(lastAnnouncedDistance - distanceMeters) > announceEveryMetters) {
        // We're closer/further by some threshold -- announce distance
        // Only announce if not actively playing something else (distance would be stale if queued)
        if (!audioQueue.isPlaying) {
          lastAnnouncedDistance = distanceMeters;
          audioQueue.addToQueue({ soundUrl: 'app/sounds/sense_mobility.wav' })
          audioQueue.addToQueue({ text: `Beacon: ${distanceMeters.toFixed(0)} meters` })
        }
      } else {
        // Transition between "on" and "off" beacons
        const angle = Math.atan2(relativePosition.x, relativePosition.y) * 180 / Math.PI;
        if (Math.abs(angle) < onCourseAngle) {
          onCourse.muted = false;
          offCourse.muted = true;
        } else {
          onCourse.muted = true;
          offCourse.muted = false;
        }
      }
    }
  });

  // Hook up listeners
  locationProvider.events.addEventListener('locationUpdated', beacon.recomputePosition)
  locationProvider.events.addEventListener('orientationUpdated', beacon.recomputePosition)

  return beacon;
}