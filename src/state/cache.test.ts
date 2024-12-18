// Mock out IndexedDB and Fetch API for testing
import 'fake-indexeddb/auto';
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
    beforeEach(async () =>{
      await cache.clear();
    });

    it('should be empty for unloaded tiles', async () => {
      const result = await cache.getFeatures("16/18109/23965");
      expect(result.length).to.equal(0);
    });

    it('should store and retrieve features', async () => {
      cache.addFeature(testFeature, "16/18109/23965");
      const result = await cache.getFeatures("16/18109/23965");
      expect(result[0].id).to.be.a('number');
      // Original feature will be annotated with an id
      expect(result[0].properties).to.deep.equal(testFeature.properties);
      expect(result![0].geometry).to.deep.equal(testFeature.geometry);    });

    it ('should fetch features by OSM ID', async () => {
      cache.addFeature(testFeature, "16/18109/23965");
      const result = await cache.getFeatureByOsmId(testFeature.osm_ids[0]);
      // Original feature will be annotated with an id
      expect(result!.id).to.be.a('number');
      expect(result!.properties).to.deep.equal(testFeature.properties);
      expect(result!.geometry).to.deep.equal(testFeature.geometry);
    });

    it ('should return no results for invalid OSM ID', async () => {
      const result = await cache.getFeatureByOsmId(9999999);
      expect(result).to.equal(null);
    });
  });
});