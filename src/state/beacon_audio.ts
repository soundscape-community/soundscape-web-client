// Copyright (c) Daniel W. Steinbrook.

import { watch } from 'vue';
import {
  beacon,
  distanceMeters,
  relativePosition,
  isOnCourse,
  isNearby
} from './beacon';
import {
  audioQueue,
  createPanner,
  PannerNodeWithCoordinates
} from '../state/audio';

const Classic_OnAxis_wav = new URL("/assets/sounds/beacons/Classic/Classic_OnAxis.wav", import.meta.url).href;
const Classic_OffAxis_wav = new URL("/assets/sounds/beacons/Classic/Classic_OffAxis.wav", import.meta.url).href;
const sense_mobility_wav = new URL("/assets/sounds/sense_mobility.wav", import.meta.url).href;
const SS_beaconFound2_48k_wav = new URL("/assets/sounds/SS_beaconFound2_48k.wav", import.meta.url).href;

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
  intervalId: number | undefined;

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

    // Set up audio handlers for beacon change events

    // Start/stop looping when beacon is toggled
    watch(() => beacon.enabled, (newValue, oldValue) => {
      if (newValue) {
        this.start();
      } else {
        this.stop();
      }
    });

    // Play "beacon found" effect when target is reached
    watch(isNearby, (newValue, oldValue) => {
      if (beacon.enabled && newValue && !oldValue) {
        beacon.disable();
        new Audio(SS_beaconFound2_48k_wav).play();
      }
    });

    // Set the beacon sound effect spatial position.
    watch(relativePosition, (newValue, oldVAlue) => {
      if (beacon.enabled && newValue) {
        this.panner.setCoordinates(newValue.x, newValue.y);
      }
    });

    // Announce the beacon distance  periodically
    watch(distanceMeters, (newValue, oldValue) => {
      if (
        beacon.enabled &&
        newValue !== undefined && (
          beacon.lastAnnouncedDistance === null ||
          Math.abs(beacon.lastAnnouncedDistance - newValue) > announceEveryMeters
        )
      ) {
        // Only announce if not actively playing something else (distance
        // would be stale if queued)
        if (!audioQueue.isPlaying) {
          beacon.lastAnnouncedDistance = newValue;
          audioQueue.addToQueue({ soundUrl: sense_mobility_wav });
          audioQueue.addToQueue({
            text: `Beacon: ${newValue.toFixed(0)} meters`,
          });
        }
      }
    });
  }

  // Loop the beacon sound effect
  async start() {
    // Resume the audio context (especially needed for Safari)
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    this.onCourseAudio.play();
    this.offCourseAudio.play()
    // Switch between on/off-course effects no more than once per second
    this.intervalId = window.setInterval(() => {
      if (isOnCourse.value) {
        this.onCourseGain.gain.setValueAtTime(1, this.audioContext.currentTime);
        this.offCourseGain.gain.setValueAtTime(0, this.audioContext.currentTime);
      } else {
        this.onCourseGain.gain.setValueAtTime(0, this.audioContext.currentTime);
        this.offCourseGain.gain.setValueAtTime(1, this.audioContext.currentTime);
      }
    }, 1000);
  }

  // Pause the beacon sound effect
  stop() {
    window.clearInterval(this.intervalId);
    this.onCourseAudio.pause();
    this.offCourseAudio.pause();
  }
}

// Initialize beacon audio only once
// (not done automatically because some browsers require audio to be
// triggered by manual user action)
let beaconAudio: BeaconAudio;
export function initializeBeaconAudio() {
  if (!beaconAudio) {
    beaconAudio = new BeaconAudio();
  }
}