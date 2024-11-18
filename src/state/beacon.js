// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

import Classic_OnAxis_wav from "/assets/sounds/beacons/Classic/Classic_OnAxis.wav";
import Classic_OffAxis_wav from "/assets/sounds/beacons/Classic/Classic_OffAxis.wav";
import sense_mobility_wav from "/assets/sounds/sense_mobility.wav";
import SS_beaconFound2_48k_wav from "/assets/sounds/SS_beaconFound2_48k.wav";

import { point } from '@turf/helpers';
import { computed, reactive, watch } from 'vue';
import { distanceTo, normalizedRelativePositionTo } from '../state/location';
import { audioQueue, createPanner } from '../state/audio.js';

const onCourseAngle = 30; // degrees +/- Y axis
const foundProximityMeters = 10; // proximity to auto-stop beacon
const announceEveryMeters = 50;

/*
For smooth transitions between "on" and "off" beacons, we keep two audio
sources constantly looping, and selectively mute one or the other. On iOS
Safari, we can't directly set the volume of an audio element, so we use
gain nodes instead. A panner node is used to create spatial audio.

The resulting audio graph looks something like this:

  source -> gain -> panner <- gain <- source
                      |
                      V
                    output
*/
export const beacon = reactive({
  name: null,
  latitude: null,
  longitude: null,
  lastAnnouncedDistance: null,
  enabled: false,

  // In some browsers, audio initialization needs to be triggerred by a user action
  initialize() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.panner = createPanner(this.audioContext);

    this.onCourseAudio = new Audio(Classic_OnAxis_wav);
    this.offCourseAudio = new Audio(Classic_OffAxis_wav);
    this.onCourseAudio.loop = true;
    this.offCourseAudio.loop = true;

    this.onCourseGain = this.audioContext.createGain();
    this.offCourseGain = this.audioContext.createGain();

    this.audioContext
        .createMediaElementSource(this.onCourseAudio)
        .connect(this.onCourseGain);
    this.audioContext
        .createMediaElementSource(this.offCourseAudio)
        .connect(this.offCourseGain);

    this.onCourseGain.connect(this.panner);
    this.offCourseGain.connect(this.panner);
    this.panner.connect(this.audioContext.destination);
  },

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
  beacon.enabled ? beacon.panner.setCoordinates(newValue.x, newValue.y) : null;
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
  async start() {
    // Resume the audio context (especially needed for Safari)
    if (beacon.audioContext.state === 'suspended') {
      await beacon.audioContext.resume();
    }
    beacon.onCourseAudio.play();
    beacon.offCourseAudio.play()
    // Switch between on/off-course effects no more than once per second
    this.intervalId = setInterval(() => {
      if (isOnCourse.value) {
        beacon.onCourseGain.gain.setValueAtTime(1, beacon.audioContext.currentTime);
        beacon.offCourseGain.gain.setValueAtTime(0, beacon.audioContext.currentTime);
      } else {
        beacon.onCourseGain.gain.setValueAtTime(0, beacon.audioContext.currentTime);
        beacon.offCourseGain.gain.setValueAtTime(1, beacon.audioContext.currentTime);
      }
    }, 1000);
  },
  stop() {
    clearInterval(this.intervalId);
    beacon.onCourseAudio.pause();
    beacon.offCourseAudio.pause();
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