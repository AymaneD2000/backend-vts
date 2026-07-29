import { BadRequestException } from '@nestjs/common';
import { ServiceType } from '../../common/service-type';
import { MerchantsService } from '../merchants/merchants.service';
import { Merchant, MerchantType } from '../merchants/entities/merchant.entity';
import { Product } from '../merchants/entities/product.entity';
import { Promotion } from '../merchants/entities/promotion.entity';
import { OrdersService } from '../orders/orders.service';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { RentalsService } from '../rentals/rentals.service';
import {
  RentalBooking,
  RentalStatus,
} from '../rentals/entities/rental-booking.entity';
import { RentalCategory } from '../rentals/entities/rental-vehicle.entity';
import { Ride, RideStatus } from '../rides/entities/ride.entity';
import { RidesService } from '../rides/rides.service';
import { DiscoveryService } from './discovery.service';
import { ActivityCursor, FeedCursor } from './discovery.types';

// Bamako-ish coordinates for deterministic distance ordering.
function merchant(id: string, lat: number, lng: number): Merchant {
  return {
    id,
    name: `Merchant ${id}`,
    type: MerchantType.RESTAURANT,
    logoUrl: null,
    lat,
    lng,
  } as unknown as Merchant;
}

function ride(id: string, createdAt: string): Ride {
  return {
    id,
    serviceType: ServiceType.RIDE_CAR,
    status: RideStatus.COMPLETED,
    fareAmount: 2500,
    currency: 'XOF',
    createdAt: new Date(createdAt),
  } as unknown as Ride;
}

function order(id: string, createdAt: string): Order {
  return {
    id,
    status: OrderStatus.DELIVERED,
    total: 5000,
    merchant: { name: 'Chez Awa' },
    createdAt: new Date(createdAt),
  } as unknown as Order;
}

function booking(id: string, createdAt: string): RentalBooking {
  return {
    id,
    vehicleName: 'Berline 4 places',
    category: RentalCategory.CAR,
    status: RentalStatus.REQUESTED,
    totalAmount: 35000,
    currency: 'XOF',
    createdAt: new Date(createdAt),
  } as unknown as RentalBooking;
}

describe('DiscoveryService', () => {
  let merchants: jest.Mocked<
    Pick<
      MerchantsService,
      | 'activeMerchants'
      | 'featuredPromotions'
      | 'previewProducts'
      | 'searchMerchants'
      | 'searchProducts'
    >
  >;
  let rides: jest.Mocked<Pick<RidesService, 'list'>>;
  let rentals: jest.Mocked<Pick<RentalsService, 'myBookings' | 'searchVehicles'>>;
  let orders: jest.Mocked<Pick<OrdersService, 'customerOrders'>>;
  let service: DiscoveryService;

  beforeEach(() => {
    merchants = {
      activeMerchants: jest.fn().mockResolvedValue([]),
      featuredPromotions: jest.fn().mockResolvedValue([]),
      previewProducts: jest.fn().mockResolvedValue(new Map()),
      searchMerchants: jest.fn().mockResolvedValue([]),
      searchProducts: jest.fn().mockResolvedValue([]),
    } as any;
    rides = { list: jest.fn().mockResolvedValue([]) } as any;
    rentals = {
      myBookings: jest.fn().mockResolvedValue([]),
      searchVehicles: jest.fn().mockResolvedValue([]),
    } as any;
    orders = { customerOrders: jest.fn().mockResolvedValue([]) } as any;
    service = new DiscoveryService(
      merchants as any,
      rides as any,
      rentals as any,
      orders as any,
    );
  });

  describe('feed', () => {
    it('ranks merchants nearest-first from the caller position', async () => {
      // origin at (12.60, -8.00); "near" is closer than "far".
      merchants.activeMerchants.mockResolvedValue([
        merchant('far', 12.9, -8.0),
        merchant('near', 12.61, -8.0),
      ]);

      const result = await service.feed({ lat: 12.6, lng: -8.0 });

      expect(result.items.map((i) => i.id)).toEqual(['near', 'far']);
      expect(result.items[0].distanceMeters).toBeLessThan(
        result.items[1].distanceMeters,
      );
    });

    it('paginates via an opaque cursor without gaps or overlaps', async () => {
      merchants.activeMerchants.mockResolvedValue([
        merchant('a', 12.61, -8.0),
        merchant('b', 12.62, -8.0),
        merchant('c', 12.63, -8.0),
      ]);

      const first = await service.feed({ lat: 12.6, lng: -8.0, limit: 2 });
      expect(first.items.map((i) => i.id)).toEqual(['a', 'b']);
      expect(first.nextCursor).not.toBeNull();

      const second = await service.feed({
        lat: 12.6,
        lng: -8.0,
        limit: 2,
        cursor: first.nextCursor!,
      });
      expect(second.items.map((i) => i.id)).toEqual(['c']);
      expect(second.nextCursor).toBeNull();
    });

    it('round-trips a decodable feed cursor payload', async () => {
      merchants.activeMerchants.mockResolvedValue([
        merchant('a', 12.61, -8.0),
        merchant('b', 12.62, -8.0),
      ]);
      const first = await service.feed({ lat: 12.6, lng: -8.0, limit: 1 });
      const decoded: FeedCursor = JSON.parse(
        Buffer.from(first.nextCursor!, 'base64url').toString('utf8'),
      );
      expect(decoded.id).toBe('a');
      expect(typeof decoded.distance).toBe('number');
    });

    it('rejects a malformed cursor with a 400', async () => {
      await expect(service.feed({ cursor: 'not-a-cursor!!' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('still returns merchants when the promotions source fails', async () => {
      merchants.activeMerchants.mockResolvedValue([merchant('a', 12.61, -8.0)]);
      merchants.featuredPromotions.mockRejectedValue(new Error('promo down'));

      const result = await service.feed({ lat: 12.6, lng: -8.0 });

      expect(result.items.map((i) => i.id)).toEqual(['a']);
      expect(result.items[0].offerBadge).toBeUndefined();
    });
  });

  describe('search', () => {
    it('groups results Meituan-style across verticals', async () => {
      merchants.searchMerchants.mockResolvedValue([merchant('m1', 12.6, -8.0)]);
      merchants.searchProducts.mockResolvedValue([
        {
          id: 'p1',
          name: 'Poulet',
          price: 2500,
          imageUrl: null,
          merchantId: 'm1',
          merchant: { name: 'Chez Awa' },
        } as unknown as Product,
      ]);
      rentals.searchVehicles.mockResolvedValue([
        {
          id: 'v1',
          name: 'Berline',
          category: RentalCategory.CAR,
          dailyPrice: 35000,
          imageUrl: null,
        } as any,
      ]);

      const result = await service.search({ q: 'aw', lat: 12.6, lng: -8.0 });

      expect(result.merchants).toHaveLength(1);
      expect(result.dishes[0]).toMatchObject({ merchantId: 'm1', merchantName: 'Chez Awa' });
      expect(result.rentals[0]).toMatchObject({ id: 'v1', dailyPrice: 35000 });
    });

    it('short-circuits queries shorter than the minimum length', async () => {
      const result = await service.search({ q: 'a' });
      expect(result).toEqual({ merchants: [], dishes: [], rentals: [] });
      expect(merchants.searchMerchants).not.toHaveBeenCalled();
    });

    it('keeps other groups when one search source fails', async () => {
      merchants.searchMerchants.mockResolvedValue([merchant('m1', 12.6, -8.0)]);
      merchants.searchProducts.mockRejectedValue(new Error('products down'));
      rentals.searchVehicles.mockResolvedValue([]);

      const result = await service.search({ q: 'burger' });

      expect(result.merchants).toHaveLength(1);
      expect(result.dishes).toEqual([]);
    });
  });

  describe('activity', () => {
    it('merge-sorts the three sources by createdAt desc', async () => {
      rides.list.mockResolvedValue([ride('r1', '2026-01-01T10:00:00Z')]);
      orders.customerOrders.mockResolvedValue([order('o1', '2026-01-03T10:00:00Z')]);
      rentals.myBookings.mockResolvedValue([booking('b1', '2026-01-02T10:00:00Z')]);

      const result = await service.activity('user-1', {});

      expect(result.items.map((i) => i.id)).toEqual(['o1', 'b1', 'r1']);
      expect(result.items.map((i) => i.type)).toEqual(['food', 'rental', 'ride']);
    });

    it('filters the timeline to a single source', async () => {
      orders.customerOrders.mockResolvedValue([order('o1', '2026-01-03T10:00:00Z')]);

      const result = await service.activity('user-1', { filter: 'food' });

      expect(rides.list).not.toHaveBeenCalled();
      expect(rentals.myBookings).not.toHaveBeenCalled();
      expect(result.items.map((i) => i.id)).toEqual(['o1']);
    });

    it('excludes merchant deliveries from rides (shown as their food order)', async () => {
      const delivery = {
        ...ride('d1', '2026-01-05T10:00:00Z'),
        serviceType: ServiceType.MERCHANT_DELIVERY,
      } as Ride;
      rides.list.mockResolvedValue([delivery]);

      const result = await service.activity('user-1', { filter: 'ride' });

      expect(result.items).toEqual([]);
    });

    it('paginates with a stable cursor and returns others on partial failure', async () => {
      rides.list.mockResolvedValue([
        ride('r1', '2026-01-01T10:00:00Z'),
        ride('r2', '2026-01-04T10:00:00Z'),
      ]);
      // rentals source throws — must not blank the timeline.
      rentals.myBookings.mockRejectedValue(new Error('rentals down'));
      orders.customerOrders.mockResolvedValue([order('o1', '2026-01-03T10:00:00Z')]);

      const first = await service.activity('user-1', { limit: 2 });
      expect(first.items.map((i) => i.id)).toEqual(['r2', 'o1']);
      expect(first.nextCursor).not.toBeNull();

      const decoded: ActivityCursor = JSON.parse(
        Buffer.from(first.nextCursor!, 'base64url').toString('utf8'),
      );
      expect(decoded.id).toBe('o1');

      const second = await service.activity('user-1', {
        limit: 2,
        cursor: first.nextCursor!,
      });
      expect(second.items.map((i) => i.id)).toEqual(['r1']);
      expect(second.nextCursor).toBeNull();
    });

    it('rejects a malformed activity cursor with a 400', async () => {
      await expect(
        service.activity('user-1', { cursor: '%%%' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('formats amounts as grouped XOF', async () => {
      orders.customerOrders.mockResolvedValue([order('o1', '2026-01-03T10:00:00Z')]);
      const result = await service.activity('user-1', { filter: 'food' });
      expect(result.items[0].amountLabel).toBe('5 000 XOF');
    });
  });
});
