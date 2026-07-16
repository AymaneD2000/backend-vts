import { BadGatewayException, BadRequestException, Injectable } from '@nestjs/common';

export interface GeocodingResult {
  label: string;
  lat: number;
  lng: number;
  type?: string;
}

@Injectable()
export class GeocodingService {
  private readonly baseUrl = 'https://nominatim.openstreetmap.org';

  async search(query: string): Promise<GeocodingResult[]> {
    const normalized = query.trim();
    if (normalized.length < 2) {
      throw new BadRequestException('Search query is too short');
    }
    const params = new URLSearchParams({
      q: `${normalized}, Mali`,
      format: 'jsonv2',
      addressdetails: '1',
      countrycodes: 'ml',
      limit: '8',
    });
    const data = await this.getJson<Array<Record<string, unknown>>>(
      `${this.baseUrl}/search?${params}`,
    );
    return data
      .map((item) => this.result(item))
      .filter((item): item is GeocodingResult => item !== null);
  }

  async reverse(lat: number, lng: number): Promise<GeocodingResult> {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw new BadRequestException('Invalid coordinates');
    }
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lng),
      format: 'jsonv2',
      addressdetails: '1',
      zoom: '18',
    });
    const data = await this.getJson<Record<string, unknown>>(
      `${this.baseUrl}/reverse?${params}`,
    );
    return (
      this.result(data) ?? {
        label: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        lat,
        lng,
      }
    );
  }

  private result(item: Record<string, unknown>): GeocodingResult | null {
    const lat = Number(item.lat);
    const lng = Number(item.lon);
    const label = String(item.display_name ?? '').trim();
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !label) return null;
    return {
      label,
      lat,
      lng,
      type: item.type == null ? undefined : String(item.type),
    };
  }

  private async getJson<T>(url: string): Promise<T> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'VTS-Mali/1.0 (local-services-platform)',
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) throw new Error(`Geocoder returned ${response.status}`);
      return (await response.json()) as T;
    } catch {
      throw new BadGatewayException('Location search is temporarily unavailable');
    }
  }
}
