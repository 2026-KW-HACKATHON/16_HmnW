import { describe, expect, it } from 'vitest';
import { distanceToPolylineMeters, progressAlongPolylineMeters } from './geo';

const route = [
  { lat: 37.62, lng: 127.057 },
  { lat: 37.62, lng: 127.06 },
  { lat: 37.623, lng: 127.06 },
];

describe('polyline geometry', () => {
  it('finds the nearest distance to any segment', () => {
    const distance = distanceToPolylineMeters({ lat: 37.621, lng: 127.0605 }, route);

    expect(distance).toBeGreaterThan(43);
    expect(distance).toBeLessThan(46);
  });

  it('measures progress to the nearest projected point', () => {
    const progress = progressAlongPolylineMeters({ lat: 37.621, lng: 127.0605 }, route);

    expect(progress).toBeGreaterThan(372);
    expect(progress).toBeLessThan(378);
  });
});
