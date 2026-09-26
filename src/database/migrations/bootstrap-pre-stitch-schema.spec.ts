import { BootstrapPreStitchSchema1783728000000 } from './1783728000000-BootstrapPreStitchSchema';
import { PRE_STITCH_SCHEMA_SQL } from '../baseline/pre-stitch-schema';

describe('BootstrapPreStitchSchema1783728000000', () => {
  it('installs the baseline only when users is absent', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([{ exists: false }])
      .mockResolvedValueOnce(undefined);
    await new BootstrapPreStitchSchema1783728000000().up({ query } as never);
    expect(query).toHaveBeenNthCalledWith(
      1,
      `SELECT to_regclass('public.users') IS NOT NULL AS exists`,
    );
    expect(query).toHaveBeenNthCalledWith(2, PRE_STITCH_SCHEMA_SQL);
  });

  it('does not mutate an existing installation', async () => {
    const query = jest.fn().mockResolvedValue([{ exists: true }]);
    await new BootstrapPreStitchSchema1783728000000().up({ query } as never);
    expect(query).toHaveBeenCalledTimes(1);
  });
});
