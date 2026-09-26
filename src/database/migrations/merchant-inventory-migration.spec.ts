import { AddMerchantExperienceAndInventory1788055200000 } from './1788055200000-AddMerchantExperienceAndInventory';

describe('AddMerchantExperienceAndInventory1788055200000', () => {
  it('adds inventory columns, merchant aggregates, and immutable engagement tables', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    await new AddMerchantExperienceAndInventory1788055200000().up({ query } as never);
    const statements = query.mock.calls.map(([sql]) => String(sql));
    expect(statements.some((sql) => sql.includes('track_inventory'))).toBe(true);
    expect(statements.some((sql) => sql.includes('stock_quantity'))).toBe(true);
    expect(statements.some((sql) => sql.includes('cover_url'))).toBe(true);
    expect(statements.some((sql) => sql.includes('merchant_favorites'))).toBe(true);
    expect(statements.some((sql) => sql.includes('merchant_reviews'))).toBe(true);
    expect(statements.some((sql) => sql.includes('inventory_movements'))).toBe(true);
    expect(statements.join('\n')).toContain('CHECK ("stock_quantity" >= 0)');
    expect(statements.join('\n')).toContain('CHECK ("balance_after" >= 0)');
  });
});
