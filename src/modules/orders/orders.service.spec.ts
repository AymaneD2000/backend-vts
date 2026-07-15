import { DataSource, Repository } from 'typeorm';
import { Merchant, MerchantStatus, MerchantType } from '../merchants/entities/merchant.entity';
import { Product } from '../merchants/entities/product.entity';
import { Promotion } from '../merchants/entities/promotion.entity';
import { RidesService } from '../rides/rides.service';
import { Order, OrderStatus } from './entities/order.entity';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  let orders: jest.Mocked<
    Pick<Repository<Order>, 'findOne' | 'findOneOrFail' | 'save'>
  >;
  let merchants: jest.Mocked<Pick<Repository<Merchant>, 'findOne' | 'find'>>;
  let products: jest.Mocked<Pick<Repository<Product>, 'find'>>;
  let promotions: jest.Mocked<Pick<Repository<Promotion>, 'find'>>;
  let dataSource: jest.Mocked<Pick<DataSource, 'transaction' | 'getRepository'>>;
  let rides: jest.Mocked<Pick<RidesService, 'request'>>;
  let service: OrdersService;

  beforeEach(() => {
    orders = {
      findOne: jest.fn(),
      findOneOrFail: jest.fn(),
      save: jest.fn((value) => Promise.resolve(value as Order)),
    } as any;
    merchants = { findOne: jest.fn(), find: jest.fn() } as any;
    products = { find: jest.fn() } as any;
    promotions = { find: jest.fn().mockResolvedValue([]) } as any;
    const historyRepository = { save: jest.fn() };
    const manager = {
      create: jest.fn((_type, value) => value),
      save: jest.fn((target, value) => {
        if (value !== undefined) return Promise.resolve(value);
        if (target.merchantId && target.customerId) {
          return Promise.resolve({ ...target, id: 'order-1' });
        }
        return Promise.resolve(target);
      }),
    };
    dataSource = {
      transaction: jest.fn((callback) => callback(manager as any)),
      getRepository: jest.fn(() => historyRepository as any),
    } as any;
    rides = { request: jest.fn() } as any;
    service = new OrdersService(
      orders as any,
      merchants as any,
      products as any,
      promotions as any,
      dataSource as any,
      rides as any,
    );
  });

  it('calculates checkout totals from stored product prices', async () => {
    merchants.findOne.mockResolvedValue({
      id: 'merchant-1',
      type: MerchantType.RESTAURANT,
      status: MerchantStatus.ACTIVE,
      acceptingOrders: true,
      minimumOrderAmount: 1000,
      deliveryFee: 500,
      lat: 12.6,
      lng: -8,
    } as Merchant);
    products.find.mockResolvedValue([
      {
        id: 'product-1',
        merchantId: 'merchant-1',
        name: 'Poulet',
        price: 2500,
        isAvailable: true,
      } as Product,
    ]);
    orders.findOne.mockResolvedValue({
      id: 'order-1',
      subtotal: 5000,
      deliveryFee: 500,
      total: 5500,
    } as Order);

    const result = await service.checkout('customer-1', {
      merchantId: 'merchant-1',
      items: [{ productId: 'product-1', quantity: 2 }],
      customerName: 'Awa',
      customerPhone: '70000000',
      deliveryAddress: 'Bamako',
      deliveryLat: 12.61,
      deliveryLng: -7.99,
    });

    expect(result.total).toBe(5500);
    expect(dataSource.transaction).toHaveBeenCalled();
  });

  it('allows customers to cancel only while an order is pending', async () => {
    const order = {
      id: 'order-1',
      customerId: 'customer-1',
      status: OrderStatus.PENDING,
    } as Order;
    orders.findOne.mockResolvedValue(order);
    orders.findOneOrFail.mockResolvedValue({
      ...order,
      status: OrderStatus.CANCELLED,
    });

    const result = await service.cancelByCustomer('customer-1', 'order-1');

    expect(result.status).toBe(OrderStatus.CANCELLED);
    expect(orders.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: OrderStatus.CANCELLED }),
    );
  });
});
