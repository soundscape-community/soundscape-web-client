// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

// This file is called "notabeacon.js" because "beacon.js" is blocked by some ad blockers.

import Classic_OnAxis_wav from "/sounds/beacons/Classic/Classic_OnAxis.wav";
import Classic_OffAxis_wav from "/sounds/beacons/Classic/Classic_OffAxis.wav";
import sense_mobility_wav from "/sounds/sense_mobility.wav";
import SS_beaconFound2_48k_wav from "/sounds/SS_beaconFound2_48k.wav";

const onCourseAngle = 30; // degrees +/- Y axis
const foundProximityMeters = 10; // proximity to auto-stop beacon
const announceEveryMeters = 50;

// Create a WebAudio panner with the settings that will be used by both
// beacons and callouts.
// https://developer.mozilla.org/en-US/docs/Web/API/PannerNode
export function createPanner(audioContext) {
  const panner = audioContext.createPanner();
  panner.panningModel = "HRTF";
  // Keep a constant volume regardless of distance from source.
  panner.distanceModel = "inverse";
  panner.refDistance = 1;
  panner.maxDistance = 1;
  panner.rolloffFactor = 1;
  // Ignore the direction the source is pointing.
  panner.coneInnerAngle = 360;
  panner.coneOuterAngle = 0;
  panner.coneOuterGain = 0;

  panner.setCoordinates = (x, y) => {
    panner.positionX.value = x;
    // Note that the panner's axes are *not* the same axes as ours,
    // namely that Y is up/down, and Z is forward/backward.
    panner.positionY.value = 0;
    panner.positionZ.value = y;
  };

  return panner;
}

export function createBeacon(
  latitude,
  longitude,
  locationProvider,
  audioQueue,
  map
) {
  const sourceLocation = turf.point([longitude, latitude]);
  var relativePosition =
    locationProvider.normalizedRelativePosition(sourceLocation);
  var lastAnnouncedDistance = null;

  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const panner = createPanner(audioContext);

  // For smooth transitions between "on" and "off" beacons, we keep two audio elements
  // constantly looping, and selectively mute one or the other.

  const onCourse = new Audio(Classic_OnAxis_wav);
  const offCourse = new Audio(Classic_OffAxis_wav);
  onCourse.loop = true;
  onCourse.volume = 0;
  offCourse.loop = true;

  const onCourseSource = audioContext.createMediaElementSource(onCourse);
  const offCourseSource = audioContext.createMediaElementSource(offCourse);
  onCourseSource.connect(panner);
  offCourseSource.connect(panner);
  panner.connect(audioContext.destination);

  // Render beacon on the visual map
  map.plotBeacon(latitude, longitude);

  var beacon = {
    start: () => {
      onCourse.play();
      offCourse.play();
      map.startBeaconPulse();
    },

    stop: () => {
      onCourse.pause();
      offCourse.pause();
      map.pauseBeaconPulse();
    },

    isEnabled: () => !onCourse.paused || !offCourse.paused,

    announceDistance: (distanceMeters) => {
      // Only announce if not actively playing something else (distance would be stale if queued)
      if (!audioQueue.isPlaying) {
        lastAnnouncedDistance = distanceMeters;
        audioQueue.addToQueue({ soundUrl: sense_mobility_wav });
        audioQueue.addToQueue({
          text: `Beacon: ${distanceMeters.toFixed(0)} meters`,
        });
      }
    },

    setOnOffCourse: (relativePosition) => {
      // Transition between "on" and "off" beacons
      const angle =
        (Math.atan2(relativePosition.x, relativePosition.y) * 180) / Math.PI;
      if (Math.abs(angle) < onCourseAngle) {
        onCourse.volume = 1.0;
        offCourse.volume = 0;
      } else {
        onCourse.volume = 0;
        offCourse.volume = 1.0;
      }
    },

    recomputePosition: () => {
      // Reevaluate how on-course we are
      if (beacon.isEnabled()) {
        relativePosition =
          locationProvider.normalizedRelativePosition(sourceLocation);
        panner.setCoordinates(relativePosition.x, relativePosition.y);

        const distanceMeters = locationProvider.distance(sourceLocation, {
          units: "meters",
        });
        if (distanceMeters < foundProximityMeters) {
          // Beacon found -- stop the audio
          beacon.stop();
          new Audio(SS_beaconFound2_48k_wav).play();
        } else if (
          Math.abs(lastAnnouncedDistance - distanceMeters) > announceEveryMeters
        ) {
          // We're closer/further by some threshold -- announce distance
          beacon.announceDistance(distanceMeters);
        } else if (onCourse.currentTime < 0.1) {
          // Update the beacon sound, if just looped
          beacon.setOnOffCourse(relativePosition);
        }
      }
    },
  };

  // Hook up listeners
  locationProvider.events.addEventListener(
    "locationUpdated",
    beacon.recomputePosition
  );
  locationProvider.events.addEventListener(
    "orientationUpdated",
    beacon.recomputePosition
  );

  return beacon;
}