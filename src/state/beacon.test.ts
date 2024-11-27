import { expect } from "chai";
import { beacon, isNearby, isOnCourse, relativePosition } from "./beacon";
import { myLocation } from '../state/location';

describe("Beacon", () => {
  beforeEach(() => {
    // Set beacon to Washington monument
    beacon.set("Washington Monument", 38.889444, -77.035278);
    beacon.enable();

    // Set our location to US Capitol (due east of monument)
    myLocation.setLocation(38.889722, -77.008889);
  });

  describe('relativePosition', () => {
    [-90.0, -179.0, -1.0].forEach(heading => {
      it(`should be in front at heading ${heading}`, () => {
        // Beacon is in front of us
        myLocation.setHeading(heading);
        expect(relativePosition.value!.y).to.be.greaterThan(0);
      });
    });
  
    [90.0, 179.0, 1.0].forEach(heading => {
      it(`should be behind at heading ${heading}`, () => {
        myLocation.setHeading(heading);
        expect(relativePosition.value!.y).to.be.lessThan(0);
      });
    });
  
    [-89.0, 0.0, 89.0].forEach(heading => {
      it(`should be to the left at heading ${heading}`, () => {
        myLocation.setHeading(heading);
        expect(relativePosition.value!.x).to.be.lessThan(0);
      });
    });
  
    [-91.0, 180.0, 91.0].forEach(heading => {
      it(`should be to the right at heading ${heading}`, () => {
        myLocation.setHeading(heading);
        expect(relativePosition.value!.x).to.be.greaterThan(0);
      });    
    });
  });

  describe('isOnCourse', () => {
    [-90.0, -95.0, -85.0].forEach(heading => {
      it(`should be on course at heading ${heading}`, () => {
        myLocation.setHeading(heading);
        expect(isOnCourse.value).to.be.true;
      });
    });
  
    [0.0, 90.0, 180.0, -130.0, -50.0].forEach(heading => {
      it(`should be off course at heading ${heading}`, () => {
        myLocation.setHeading(heading);
        expect(isOnCourse.value).to.be.false;
      });
    });
  });

  describe('isNearby', () => {
    it("should be false when far away", () => {
      expect(isNearby.value).to.be.false;
    });
  
    it("should be true when nearby", () => {
      myLocation.setLocation(beacon.latitude!, beacon.longitude!);
      expect(isNearby.value).to.be.true;
    });
  });
});