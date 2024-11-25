import { cache } from "./cache";
import { expect } from "chai";

describe("cache", () => {
  it('should be empty for unloaded tiles', () => {
    cache.getFeatures("16/18109/23965").then((result) => {
      expect(result.length).to.equal(0);
    });
  });

  it('should store and retrieve features', () => {
    // Real feature extracted from tile
    cache.addFeature({
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
    },
    "16/18109/23965");

    cache.getFeatures("16/18109/23965").then((result) => {
      expect(result.length).to.equal(1);
      expect(result[0]).to.include({
        "feature_type": "amenity",
        "feature_value": "cafe",  
      });
    });
  });
});