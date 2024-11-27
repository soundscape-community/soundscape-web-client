// Mock out IndexedDB and Fetch API for testing
import 'fake-indexeddb/auto';
import fs from 'fs';
import nock from 'nock';
import { expect } from "chai";
import { cache, SoundscapeFeature } from "./cache";

describe("Cache", () => {
  // Real feature extracted from tile
  const testFeature: SoundscapeFeature = {
    "feature_type": "amenity",
    "feature_value": "cafe",
    "geometry": {
      "coordinates": [-80.52166, 43.463198],
      "type": "Point"
    },
    "osm_ids": [503048818],
    "properties": {
      "amenity": "cafe",
      "cuisine": "bubble_tea",
      "name": "The Bingsu"
    },
    "type": "Feature"
  };

  describe("feature", () => {
    it('should be empty for unloaded tiles', async () => {
      const result = await cache.getFeatures("16/18109/23965");
      expect(result.length).to.equal(0);
    });

    it('should store and retrieve features', async () => {
      cache.addFeature(testFeature, "16/18109/23965");
      const result = await cache.getFeatures("16/18109/23965");
      expect(result.length).to.equal(1);
      // Original feature will be annotated with an id
      expect(result[0]).to.deep.equal({...testFeature, id: 1});
    });

    it ('should fetch features by OSM ID', async () => {
      cache.addFeature(testFeature, "16/18109/23965");
      const result = await cache.getFeatureByOsmId(testFeature.osm_ids[0]);
      // Original feature will be annotated with an id
      expect(result).to.deep.equal({...testFeature, id: 1});
    });

    it ('should return no results for invalid OSM ID', async () => {
      const result = await cache.getFeatureByOsmId(9999999);
      expect(result).to.equal(null);
    });
  });

  describe('tile', () => {
    before(() => {
      nock.disableNetConnect();
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
      const scope = nock('https://tiles.soundscape.services')
        .get('/tiles/16/18109/23965.json')
        .reply(200, tileData);

      await cache.fetch(
        'https://tiles.soundscape.services/tiles/16/18109/23965.json',
        '16/18109/23965'
      );
      expect(scope.isDone()).to.be.true;
    });

    it('should not re-request fresh tile data', async () => {
      const scope = nock('https://tiles.soundscape.services')
        .get('/tiles/16/18109/23965.json')
        .reply(200, tileData);

      await cache.fetch(
        'https://tiles.soundscape.services/tiles/16/18109/23965.json',
        '16/18109/23965'
      );
      expect(scope.isDone()).to.be.false;
    });
  });
});