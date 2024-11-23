declare module "#vendor/unmute.js" {
  export default function unmute(
    audioContext: AudioContext,
    allowBackgroundPlayback: boolean,
    forceIOSBehavior: boolean
  ): void;
}
