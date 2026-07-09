import { haversineMeters } from './geo';

describe('haversineMeters', () => {
  it('is zero for identical points', () => {
    const p = { lat: 12.6392, lng: -8.0029 }; // Bamako
    expect(haversineMeters(p, p)).toBe(0);
  });

  it('approximates a known short distance within tolerance', () => {
    // Two points ~1.11 km apart along a meridian (0.01 deg latitude).
    const a = { lat: 12.6, lng: -8.0 };
    const b = { lat: 12.61, lng: -8.0 };
    const d = haversineMeters(a, b);
    expect(d).toBeGreaterThan(1100);
    expect(d).toBeLessThan(1120);
  });

  it('is symmetric', () => {
    const a = { lat: 12.6, lng: -8.0 };
    const b = { lat: 12.7, lng: -8.1 };
    expect(haversineMeters(a, b)).toBeCloseTo(haversineMeters(b, a), 6);
  });
});
