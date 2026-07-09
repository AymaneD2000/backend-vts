import { Injectable, Logger } from '@nestjs/common';
import { haversineMeters, LatLng } from '../../common/geo';

export interface RouteResult {
  distanceM: number;
  // Road duration in seconds when available from the router; undefined when we
  // fell back to a straight-line estimate (pricing then estimates duration).
  durationS?: number;
}

// Public OSRM demo server: free, no API key, rate-limited and meant for light
// or dev use. Swap for a self-hosted instance or keyed provider in production.
const OSRM_BASE_URL = 'https://router.project-osrm.org';
const REQUEST_TIMEOUT_MS = 4000;

/**
 * Computes the real road distance/duration between two points using OSRM.
 * Falls back to the great-circle (haversine) distance if the router is
 * unreachable so pricing never fails.
 */
@Injectable()
export class RoutingService {
  private readonly logger = new Logger(RoutingService.name);

  async route(from: LatLng, to: LatLng): Promise<RouteResult> {
    const url =
      `${OSRM_BASE_URL}/route/v1/driving/` +
      `${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) return this.fallback(from, to);
      const body = (await res.json()) as {
        routes?: { distance: number; duration: number }[];
      };
      const route = body.routes?.[0];
      if (!route) return this.fallback(from, to);
      return {
        distanceM: Math.round(route.distance),
        durationS: Math.round(route.duration),
      };
    } catch {
      this.logger.warn('OSRM routing failed; using straight-line distance');
      return this.fallback(from, to);
    } finally {
      clearTimeout(timeout);
    }
  }

  private fallback(from: LatLng, to: LatLng): RouteResult {
    return { distanceM: Math.round(haversineMeters(from, to)) };
  }
}
