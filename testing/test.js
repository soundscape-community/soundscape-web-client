const assert = require('assert');
const { describe, it } = require('node:test');
const { expect } = require('chai');
const { createBoundingBox, latLonToTileCoords } = require('../app/js/spatial/geo.js');

describe('createBoundingBox', function () {
  it('should create a half-kilometer bounding box around a point', function () {
    const latitude = 40.7128; // Example latitude
    const longitude = -74.0060; // Example longitude
    const radiusMeters = 500; // Half-kilometer radius

    const bbox = createBoundingBox(latitude, longitude, radiusMeters);

    assert(bbox[0] < bbox[2]);
    assert(bbox[1] < bbox[3]);
  });
});

//testing with extreme longitude and latitude
describe('latLonToTileCoords', function() {
  it('should return the correct tile coordinates for maximum latitude and longitude', function() {
    const result = latLonToTileCoords(90, 180, 10);
    expect(result).to.deep.equal({ x: 1023, y: 1023, z: 10 });
  });

  it('should return the correct tile coordinates for minimum latitude and longitude', () => {
    const result = latLonToTileCoords(-90, -180, 5);
    expect(result).to.deep.equal({ x: 0, y: 0, z: 5 });
  });

  it('should return the correct tile coordinates for coordinates near the International Date Line', () => {
    const result = latLonToTileCoords(0, 180, 8);
    expect(result).to.deep.equal({ x: 255, y: 0, z: 7 });
  });

  it('should return the correct tile coordinates for extreme latitude with negative longitude', () => {
    const result = latLonToTileCoords(85, -120, 15);
    expect(result).to.deep.equal({ x: 48062, y: 30290, z: 15 });
  });

  it('should return the correct tile coordinates for extreme latitude with positive longitude', () => {
    const result = latLonToTileCoords(-85, 150, 18);
    expect(result).to.deep.equal({ x: 8190, y: 0, z: 18 });
  });

});

//create more tests