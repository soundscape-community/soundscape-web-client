import { expect } from "chai";
import {
  createBoundingBox,
  latLonToTileCoords,
} from "./tile";

describe("createBoundingBox", () => {
  it("should create a half-kilometer bounding box around a point", () => {
    const latitude = 40.7128; // Example latitude
    const longitude = -74.006; // Example longitude
    const radiusMeters = 500; // Half-kilometer radius

    const bbox = createBoundingBox(latitude, longitude, radiusMeters);

    expect(bbox[0]).to.be.lessThan(bbox[2]); // Use Chai's expect syntax
    expect(bbox[1]).to.be.lessThan(bbox[3]); // Use Chai's expect syntax
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
