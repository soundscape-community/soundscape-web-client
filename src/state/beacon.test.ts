import { expect } from "chai";
import { beacon, isOnCourse } from "./beacon";
import { myLocation } from '../state/location';

describe("beacon", () => {
  it("should calculate on/off course", () => {
    beacon.set({
      name: "Washington Monument",
      latitude: 38.889444,
      longitude: -77.035278,
    });
    beacon.enabled = true;

    // US Capitol (due east of monument)
    myLocation.setLocation(38.889722, -77.008889);
    // Facing west
    myLocation.setHeading(-90.0);
    expect(isOnCourse.value).to.be.true;

    // Facing north
    myLocation.setHeading(0.0);
    expect(isOnCourse.value).to.be.false;
  });
});