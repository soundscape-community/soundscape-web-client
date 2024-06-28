// Copyright (c) Daniel W. Steinbrook.
// with many thanks to ChatGPT

// Cross-platform compass heading
// https://stackoverflow.com/a/75792197
export function startCompassListener(callback) {
  if (!window["DeviceOrientationEvent"]) {
    console.warn("DeviceOrientation API not available");
    return;
  }
  let absoluteListener = (e) => {
    if (!e.absolute || e.alpha == null || e.beta == null || e.gamma == null)
      return;
    let compass = -(e.alpha + e.beta * e.gamma / 90);
    compass -= Math.floor(compass / 360) * 360; // Wrap into range [0,360].
    window.removeEventListener("deviceorientation", webkitListener);
    callback(compass);
  };
  let webkitListener = (e) => {
    let compass = e.webkitCompassHeading;
    if (compass!=null && !isNaN(compass)) {
      callback(compass);
      window.removeEventListener("deviceorientationabsolute", absoluteListener);
    }
  }

  function addListeners() {
    // Add both listeners, and if either succeeds then remove the other one.
    window.addEventListener("deviceorientationabsolute", absoluteListener);
    window.addEventListener("deviceorientation", webkitListener);
  }

  if (typeof (DeviceOrientationEvent["requestPermission"]) === "function") {
    DeviceOrientationEvent["requestPermission"]()
    .then(response => {
      if (response == "granted") {
        addListeners();
      } else
        console.warn("Permission for DeviceMotionEvent not granted");
    });
  } else
    addListeners();
}

// For estimating heading using stream of points
export class HeadingCalculator {
  constructor(windowSize) {
    this.windowSize = windowSize;
    this.points = [];
  }

  addPoint(latitude, longitude) {
    this.points.push({ latitude, longitude });
    if (this.points.length > this.windowSize) {
      this.points.shift(); // Remove the oldest point if the window size is exceeded
    }
  }

  resetPoints() {
    this.points = [];
  }

  computeHeading() {
    if (this.points.length < 2) {
      //console.error('Insufficient points to compute heading');
      return null;
    }

    const totalPoints = this.points.length;

    // Calculate the average heading using all points in the window
    let totalHeading = 0;
    for (let i = 0; i < totalPoints - 1; i++) {
      const point1 = this.points[i];
      const point2 = this.points[i + 1];

      const lat1 = this.degreesToRadians(point1.latitude);
      const lon1 = this.degreesToRadians(point1.longitude);
      const lat2 = this.degreesToRadians(point2.latitude);
      const lon2 = this.degreesToRadians(point2.longitude);

      const deltaLon = lon2 - lon1;

      const y = Math.sin(deltaLon) * Math.cos(lat2);
      const x =
        Math.cos(lat1) * Math.sin(lat2) -
        Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);

      let heading = Math.atan2(y, x);
      heading = this.radiansToDegrees(heading);
      heading = (heading + 360) % 360; // Ensure the heading is between 0 and 360 degrees

      totalHeading += heading;
    }

    // Calculate the average heading
    const averageHeading = totalHeading / (totalPoints - 1);

    return averageHeading;
  }

  degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  radiansToDegrees(radians) {
    return radians * (180 / Math.PI);
  }
}
