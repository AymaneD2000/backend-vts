import { AddMobilityOffersAndPricing1788141600000 } from './1788141600000-AddMobilityOffersAndPricing';

describe('AddMobilityOffersAndPricing1788141600000', () => {
  it('adds tier, quote snapshot, offer and driver session schema', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    await new AddMobilityOffersAndPricing1788141600000().up({ query } as never);
    const sql = query.mock.calls.map(([value]) => String(value)).join('\n');
    expect(sql).toContain('ride_tier');
    expect(sql).toContain('rate_cards');
    expect(sql).toContain('demand_zones');
    expect(sql).toContain('ride_offers');
    expect(sql).toContain('driver_online_sessions');
    expect(sql).toContain('pin_required');
  });
});
