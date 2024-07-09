// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

// This file is called "notabeacon.js" because "beacon.js" is blocked by some ad blockers.

import Classic_OnAxis_wav from "/assets/sounds/beacons/Classic/Classic_OnAxis.wav";
import Classic_OffAxis_wav from "/assets/sounds/beacons/Classic/Classic_OffAxis.wav";
import sense_mobility_wav from "/assets/sounds/sense_mobility.wav";
import SS_beaconFound2_48k_wav from "/assets/sounds/SS_beaconFound2_48k.wav";

import { point } from '@turf/helpers';
import { computed, reactive, watch } from 'vue';
import { distanceTo, normalizedRelativePositionTo } from '../store/location.js';
import { audioQueue, createPanner } from '../utils/sound.js';

const onCourseAngle = 30; // degrees +/- Y axis
const foundProximityMeters = 10; // proximity to auto-stop beacon
const announceEveryMeters = 50;

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const panner = createPanner(audioContext);

// Ideally, for smooth transitions between "on" and "off" beacons, we would 
// keep two audio elements constantly looping, and selectively mute one or
// the other. But iOS Safari doesn't allow volume to be set by JS, so we
// keep one paused while the other plays.

const onCourse = new Audio(Classic_OnAxis_wav);
const offCourse = new Audio(Classic_OffAxis_wav);
onCourse.loop = true;
offCourse.loop = true;

const onCourseSource = audioContext.createMediaElementSource(onCourse);
const offCourseSource = audioContext.createMediaElementSource(offCourse);
onCourseSource.connect(panner);
offCourseSource.connect(panner);
panner.connect(audioContext.destination);

export const beacon = reactive({
  name: null,
  latitude: null,
  longitude: null,
  lastAnnouncedDistance: null,
  enabled: false,

  set(name, latitude, longitude) {
    this.name = name;
    this.latitude = latitude;
    this.longitude = longitude;
    this.lastAnnouncedDistance = null;
  },
  clear() { this.set(null, null, null); },
  start() {
    this.enabled = true;
    looper.start();
  },
  stop() {
    this.enabled = false;
    looper.stop();
  },
});

// Turf.js point of the beacon's location
const sourceLocation = computed(
  () => beacon.enabled ? point([beacon.longitude, beacon.latitude]) : null
);

// Distance we are currently from the beacon
const distanceMeters = computed(
  () => beacon.enabled ? distanceTo.value(sourceLocation.value, { units: "meters", }) : null
);

// Beacon's X/Y coordinates relative to us (standing at the origin, looking up Y axis)
const relativePosition = computed(
  () => beacon.enabled ? normalizedRelativePositionTo.value(sourceLocation.value) : null
);

// Set the beacon sound effect spatial position.
watch(relativePosition, (newValue, oldVAlue) => {
  beacon.enabled ? panner.setCoordinates(newValue.x, newValue.y) : null;
});

// True if we are roughly facing the beacon, +/- onCourseAngle
const isOnCourse = computed(() => {
  if (!beacon.enabled) return false;
  const angle = Math.atan2(
    relativePosition.value.x,
    relativePosition.value.y
  ) * 180 / Math.PI;
  return (Math.abs(angle) < onCourseAngle);
});

// Loop beacon audio, which changes based on how on-/off-course we are.
const looper = {
  intervalId: null,
  start() {
    this.intervalId = setInterval(() => {
      if (isOnCourse.value) {
        onCourse.play();
        offCourse.pause();
      } else {
        onCourse.pause();
        offCourse.play();
      }
    }, 1000);
  },
  stop() {
    clearInterval(this.intervalId);
    onCourse.pause();
    offCourse.pause();
  },
};

// Announce the beacon distance  periodically
watch(distanceMeters, (newValue, oldValue) => {
  if (!beacon.enabled) {
    return;
  } else if(newValue < foundProximityMeters) {
    // Stop the beacon when we're within the threshold.
    beacon.stop();
    new Audio(SS_beaconFound2_48k_wav).play();
  } else if (
    Math.abs(beacon.lastAnnouncedDistance - newValue) > announceEveryMeters
  ) {
    // We're closer/further by some threshold -- announce distance
    // Only announce if not actively playing something else (distance would be stale if queued)
    if (!audioQueue.isPlaying) {
      beacon.lastAnnouncedDistance = distanceMeters.value;
      audioQueue.addToQueue({ soundUrl: sense_mobility_wav });
      audioQueue.addToQueue({
        text: `Beacon: ${distanceMeters.value.toFixed(0)} meters`,
      });
    }
  }
});