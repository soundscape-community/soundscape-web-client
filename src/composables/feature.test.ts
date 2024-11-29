import fs from 'fs';
import { Tile } from './tile';
import { nearbyFeatures, SpeakableFeature } from './feature';
import { expect, use } from 'chai';
import { myLocation } from '../state/location';
import chaiSorted from 'chai-sorted';

describe('nearbyFeatures', () => {
  const tileData = JSON.parse(
    fs.readFileSync(
      'cypress/fixtures/tiles_16_18749_25070.json',
      'utf8'
    )
  );
  const radiusMeters = 100;
  let nearby: SpeakableFeature[];

  before(async () => {
    // Washington Union Station
    let lat = 38.897600, lon = -77.006156;
    await new Tile({ x: 18749, y: 25070, z: 16 }).import(tileData.features);
    myLocation.setLocation(lat, lon);
    nearby = await nearbyFeatures(lat, lon, radiusMeters);
  });
  
  it('should contain a subset of features', () => {
    expect(nearby.length).to.be.greaterThan(0);
    expect(nearby.length).to.be.lessThan(tileData.features.length);
  });

  it('should only contain features within radius', () => {
    expect(nearby.every(x => x.distance <= radiusMeters)).to.be.true;
  })

  it('should contain intersections', () => {
    expect(nearby.some(x => x.feature_value == 'gd_intersection')).to.be.true;
  });

  it('should be sorted nearest first', () => {
    use(chaiSorted);
    expect(nearby).to.be.sortedBy('distance');
  })
});