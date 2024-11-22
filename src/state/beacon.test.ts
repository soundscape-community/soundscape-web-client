import { expect } from "chai";
import { beacon, isNearby, isOnCourse } from "./beacon";
import { myLocation } from '../state/location';

describe("beacon", () => {
  it("should calculate on/off course", () => {
    beacon.set("Washington Monument", 38.889444, -77.035278);
    beacon.enable();

    // US Capitol (due east of monument)
    myLocation.setLocation(38.889722, -77.008889);
    // Various heading roughly facing west
    [-90.0, -95.0, -85.0].forEach(heading => {
      myLocation.setHeading(heading);
      expect(isOnCourse.value).to.be.true;
    });

    // Various headings facing any other direction
    [0.0, 90.0, 180.0, -130.0, -50.0].forEach(heading => {
      myLocation.setHeading(heading);
      expect(isOnCourse.value).to.be.false;
    });
  });

  it("should recognize nearby threshold", () => {
    beacon.set("Washington Monument", 38.889444, -77.035278);
    beacon.enable();

    // US Capitol (due east of monument)
    myLocation.setLocation(38.889722, -77.008889);
    expect(isNearby.value).to.be.false;

    myLocation.setLocation(beacon.latitude!, beacon.longitude!);
    expect(isNearby.value).to.be.true;
  });
});