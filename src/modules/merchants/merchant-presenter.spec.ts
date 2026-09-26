import { MerchantType } from './entities/merchant.entity';
import { MerchantPresenter } from './merchant-presenter';

describe('MerchantPresenter', () => {
  const presenter = new MerchantPresenter();

  it('hides exact stock quantity from public products while exposing effective availability', () => {
    const product = {
      id: 'p1',
      merchantId: 'm1',
      categoryId: 'c1',
      name: 'Rice',
      price: 1000,
      isAvailable: true,
      trackInventory: true,
      stockQuantity: 0,
    } as any;
    const result = presenter.publicProduct(product);
    expect(result).toEqual(expect.objectContaining({ trackInventory: true, isAvailable: false }));
    expect(result).not.toHaveProperty('stockQuantity');
  });

  it('returns stock quantity only to the owning merchant', () => {
    const result = presenter.ownerProduct({
      id: 'p1', merchantId: 'm1', categoryId: 'c1', name: 'Rice', price: 1000,
      isAvailable: true, trackInventory: true, stockQuantity: 4,
    } as any);
    expect(result.stockQuantity).toBe(4);
  });

  it('includes cover, rating and merchant identity in public DTOs', () => {
    const result = presenter.publicMerchant({
      id: 'm1', name: 'Chez Awa', type: MerchantType.RESTAURANT,
      logoUrl: null, coverUrl: '/merchant-covers/a.jpg', ratingAvg: 4.5,
      ratingCount: 12, acceptingOrders: true, deliveryFee: 250,
      minimumOrderAmount: 1000, estimatedDeliveryMinutes: 30,
      status: 'active', lat: 12.6, lng: -8,
    } as any, true);
    expect(result).toEqual(expect.objectContaining({
      id: 'm1', coverUrl: '/merchant-covers/a.jpg', ratingAvg: 4.5,
      ratingCount: 12, isFavorite: true,
    }));
  });
});
