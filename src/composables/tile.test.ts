import fs from 'fs';
import nock from 'nock';
import { expect } from "chai";
import {
  createBoundingBox,
  createTile,
  latLonToTileCoords,
  enumerateTilesAround,
} from "./tile";
import config from '../config';
import cache from '../state/cache';

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

  describe('shouldRefresh', () => {
    beforeEach(async () => {
      await cache.clear();
    });

    it('should be true when tile has not been fetched', async () => {
      let tile = createTile(18109, 23965, 16);
      expect(await tile.shouldRefresh()).to.be.true;
    });

    it('should be false when tile has been fetched recently', async () => {
      let tile = createTile(18109, 23965, 16);
      cache.updateLastFetch(tile.url);
      expect(await tile.shouldRefresh()).to.be.false;
    });
  });

  describe('load', () => {
    before(() => {
      nock.disableNetConnect();
      // Unlike browser environment, Node needs full URL for fetch
      config.tileServer = 'https://tiles.soundscape.services';
    });
    beforeEach(async () => {
      await cache.clear();
    });
    afterEach(() => {
      nock.cleanAll();
    });

    const tileData = JSON.parse(
      fs.readFileSync(
        'cypress/fixtures/tiles_16_18109_23965.json',
        'utf8'
      )
    );

    it('should fetch tile data when unavailable', async () => {
      const scope = nock(config.tileServer)
        .get('/16/18109/23965.json')
        .reply(200, tileData);

      await createTile(18109, 23965, 16).load();
      expect(scope.isDone()).to.be.true;
    });

    it('should not re-request fresh tile data', async () => {
      let tile = createTile(18109, 23965, 16);
      // Pretend we just loaded tile data
      cache.updateLastFetch(tile.url);

      const scope = nock(config.tileServer)
        .get('/16/18109/23965.json')
        .reply(200, tileData);
      await tile.load();

      expect(scope.isDone()).to.be.false;
    });
  });
});