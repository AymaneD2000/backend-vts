import { InventoryService } from './inventory.service';

describe('InventoryService', () => {
  it('requires a non-negative quantity when tracking is enabled', async () => {
    const service = new InventoryService({} as any, {} as any, {} as any);
    await expect(service.setStock('u1', 'm1', 'p1', { trackInventory: true } as any)).rejects.toThrow();
  });

  it('clears stock quantity when tracking is disabled', async () => {
    const product = { id: 'p1', merchantId: 'm1', trackInventory: true, stockQuantity: 4 };
    const products = { findOne: jest.fn().mockResolvedValue(product), save: jest.fn().mockImplementation(async (value) => value) };
    const merchants = { findOne: jest.fn().mockResolvedValue({ id: 'm1', ownerUserId: 'u1' }) };
    const movements = { findOne: jest.fn().mockResolvedValue(null), save: jest.fn() };
    const service = new InventoryService(products as any, merchants as any, movements as any);
    const result = await service.setStock('u1', 'm1', 'p1', { trackInventory: false });
    expect(result.stockQuantity).toBeNull();
    expect(result.trackInventory).toBe(false);
    expect(movements.save).not.toHaveBeenCalled();
  });
});
