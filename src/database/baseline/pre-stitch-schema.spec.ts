import { readFileSync } from 'fs';
import { join } from 'path';
import { PRE_STITCH_SCHEMA_SQL } from './pre-stitch-schema';

describe('pre-Stitch schema baseline', () => {
  it('matches the immutable integration fixture byte for byte', () => {
    const fixture = readFileSync(
      join(__dirname, '../../../test/fixtures/pre-stitch-schema.sql'),
      'utf8',
    );
    expect(fixture).toBe(PRE_STITCH_SCHEMA_SQL);
  });

  it('contains the baseline and excludes later operational-parity tables', () => {
    for (const required of ['uuid-ossp', 'users', 'rides', 'merchants', 'products', 'orders']) {
      expect(PRE_STITCH_SCHEMA_SQL).toContain(required);
    }
    for (const forbidden of [
      'merchant_favorites',
      'ride_offers',
      'payment_transactions',
      'driver_ledger_entries',
    ]) {
      expect(PRE_STITCH_SCHEMA_SQL).not.toContain(forbidden);
    }
  });
});
