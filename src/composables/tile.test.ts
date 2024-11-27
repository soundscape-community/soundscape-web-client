import { expect } from "chai";
import {
  createBoundingBox,
  latLonToTileCoords,
  enumerateTilesAround,
} from "./tile";

describe('Tile', () => {
  describe("createBoundingBox", () => {
    it("should create a half-kilometer bounding box around a point", () => {
      const latitude = 40.7128;
      const longitude = -74.006;
      const radiusMeters = 500;
  
      const bbox = createBoundingBox(latitude, longitude, radiusMeters);
  
      expect(bbox[0]).to.be.lessThan(bbox[2]);
      expect(bbox[1]).to.be.lessThan(bbox[3]);
    });
  });
  
  describe("latLonToTileCoords", () => {
    it("should return the correct tile coordinates for latitude 0 and longitude 0 at zoom level 0", () => {
      const result = latLonToTileCoords(0, 0, 0);
      expect(result).to.deep.equal({ x: 0, y: 0, z: 0 });
    });
  
    it("should return the correct tile coordinates for latitude 0 and longitude 0 at higher zoom level", () => {
      const result = latLonToTileCoords(0, 0, 10);
      expect(result).to.deep.equal({ x: 512, y: 512, z: 10 });
    });
  
    it("should return the correct tile coordinates for negative latitude and positive longitude", () => {
      const result = latLonToTileCoords(-45, 90, 5);
      expect(result).to.deep.equal({ x: 24, y: 20, z: 5 });
    });
  
    it("should return the correct tile coordinates for latitude 0 and positive longitude", () => {
      const result = latLonToTileCoords(0, 90, 3);
      expect(result).to.deep.equal({ x: 6, y: 4, z: 3 });
    });
  });
  
  describe("enumerateTilesAround", () => {
    it('should return tiles around location', () => {
      // 10m radius around Washington Monument
      const result = enumerateTilesAround(38.889444, -77.035278, 10)
      expect(result.length).to.equal(1);
      expect(result[0]).to.include({
        x: 18744,
        y: 25072,
        z: 16,
        key: '16/18744/25072',
      });
    });
  
    it('should return more tiles for a bigger radius', () => {
      // 1km radius around Washington Monument
      const result = enumerateTilesAround(38.889444, -77.035278, 1000)
      expect(result.length).to.equal(25);
    });
  });
});