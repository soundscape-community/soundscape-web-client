// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

import { point } from '@turf/turf';
import { computed, reactive, watch } from 'vue';
import { distanceTo, normalizedRelativePositionTo } from '../state/location';
import { audioQueue, createPanner, PannerNodeWithCoordinates } from '../state/audio';

const Classic_OnAxis_wav = new URL("/assets/sounds/beacons/Classic/Classic_OnAxis.wav", import.meta.url).href;
const Classic_OffAxis_wav = new URL("/assets/sounds/beacons/Classic/Classic_OffAxis.wav", import.meta.url).href;
const sense_mobility_wav = new URL("/assets/sounds/sense_mobility.wav", import.meta.url).href;
const SS_beaconFound2_48k_wav = new URL("/assets/sounds/SS_beaconFound2_48k.wav", import.meta.url).href;

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
class BeaconAudio {
  audioContext: AudioContext;
  panner: PannerNodeWithCoordinates;
  onCourseAudio: HTMLAudioElement;
  offCourseAudio: HTMLAudioElement;
  onCourseGain: GainNode;
  offCourseGain: GainNode;

  // In some browsers, audio initialization needs to be triggerred by a user action
  constructor() {
    if ('AudioContext' in window) {
      this.audioContext = new AudioContext();
    } else if ('webkitAudioContext' in window) {
      this.audioContext = new (window as any).webkitAudioContext();
    } else {
      throw new Error('AudioContext is not supported in this browser.');
    }

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
  }
}

interface BeaconLocation {
  name: string;
  latitude: number;
  longitude: number;
}

interface BeaconState {
  audio: BeaconAudio | undefined;
  location: BeaconLocation | null;
  lastAnnouncedDistance: number | null;
  enabled: boolean;

  initialize: () => void;
  getAudio: () => BeaconAudio;
  set: (location: BeaconLocation) => void;
  clear: () => void;
  start: () => void;
  stop: () => void;
}
export const beacon = reactive<BeaconState>({
  location: null,
  lastAnnouncedDistance: null,
  enabled: false,
  audio: undefined,

  // Ensures we only initialize audio once
  initialize() {
    if (this.audio === undefined) {
      this.audio = new BeaconAudio();
    }
  },

  // Ensures that we don't try any beacon actions before audio initialization
  getAudio(): BeaconAudio {
    if (this.audio === undefined) {
      throw new Error("Beacon audio uninitialized");
    }
    return this.audio;
  },

  set(location: BeaconLocation) {
    this.location = location;
    this.lastAnnouncedDistance = null;
  },

  clear() { this.location = null; },

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
const sourceLocation = computed(() => {
  if (beacon.enabled && beacon.location) {
    return point([beacon.location.longitude, beacon.location.latitude]);
  }
});

// Distance we are currently from the beacon
const distanceMeters = computed(() => {
  if (sourceLocation.value) {
    return distanceTo.value(sourceLocation.value, { units: "meters", });
  }
});

// Beacon's X/Y coordinates relative to us (standing at the origin, looking up Y axis)
const relativePosition = computed(() => {
  if (sourceLocation.value) {
    return normalizedRelativePositionTo.value(sourceLocation.value);
  }
});

// Set the beacon sound effect spatial position.
watch(relativePosition, (newValue, oldVAlue) => {
  if (beacon.enabled && newValue !== undefined) {
    beacon.getAudio().panner.setCoordinates(newValue.x, newValue.y);
  }
});

// True if we are roughly facing the beacon, +/- onCourseAngle
const isOnCourse = computed(() => {
  if (beacon.enabled && relativePosition.value) {
    const angle = Math.atan2(
      relativePosition.value.x,
      relativePosition.value.y
    ) * 180 / Math.PI;
    return (Math.abs(angle) < onCourseAngle);
  } else {
    return false;
  }
});

// Loop beacon audio, which changes based on how on-/off-course we are.
interface Looper {
  intervalId: number | undefined;
  start: () => void;
  stop: () => void;
}
const looper: Looper = {
  intervalId: undefined,
  async start() {
    let audio = beacon.getAudio();
    // Resume the audio context (especially needed for Safari)
    if (audio.audioContext.state === 'suspended') {
      await audio.audioContext.resume();
    }
    audio.onCourseAudio.play();
    audio.offCourseAudio.play()
    // Switch between on/off-course effects no more than once per second
    this.intervalId = window.setInterval(() => {
      if (isOnCourse.value) {
        audio.onCourseGain.gain.setValueAtTime(1, audio.audioContext.currentTime);
        audio.offCourseGain.gain.setValueAtTime(0, audio.audioContext.currentTime);
      } else {
        audio.onCourseGain.gain.setValueAtTime(0, audio.audioContext.currentTime);
        audio.offCourseGain.gain.setValueAtTime(1, audio.audioContext.currentTime);
      }
    }, 1000);
  },
  stop() {
    let audio = beacon.getAudio();
    window.clearInterval(this.intervalId);
    audio.onCourseAudio.pause();
    audio.offCourseAudio.pause();
  },
};

// Announce the beacon distance  periodically
watch(distanceMeters, (newValue, oldValue) => {
  if (!beacon.enabled || typeof newValue !== "number") {
    return;
  } else if(newValue < foundProximityMeters) {
    // Stop the beacon when we're within the threshold.
    beacon.stop();
    new Audio(SS_beaconFound2_48k_wav).play();
  } else if (
    beacon.lastAnnouncedDistance === null ||
    Math.abs(beacon.lastAnnouncedDistance - newValue) > announceEveryMeters
  ) {
    // We're closer/further by some threshold -- announce distance
    // Only announce if not actively playing something else (distance would be stale if queued)
    if (!audioQueue.isPlaying) {
      beacon.lastAnnouncedDistance = newValue;
      audioQueue.addToQueue({ soundUrl: sense_mobility_wav });
      audioQueue.addToQueue({
        text: `Beacon: ${newValue.toFixed(0)} meters`,
      });
    }
  }
});