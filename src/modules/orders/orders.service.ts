import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  In,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { ServiceType } from '../../common/service-type';
import { Merchant, MerchantStatus } from '../merchants/entities/merchant.entity';
import { Product } from '../merchants/entities/product.entity';
import { Promotion, PromotionType } from '../merchants/entities/promotion.entity';
import { RequestRideDto } from '../rides/dto/request-ride.dto';
import { PaymentMethod, RideStatus } from '../rides/entities/ride.entity';
import { RIDE_UPDATED, RideUpdatedEvent } from '../rides/ride-events';
import { RidesService } from '../rides/rides.service';
import { CheckoutOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatusHistory } from './entities/order-status-history.entity';
import { Order, OrderStatus } from './entities/order.entity';

const MERCHANT_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  [OrderStatus.PENDING]: [OrderStatus.ACCEPTED, OrderStatus.CANCELLED],
  [OrderStatus.ACCEPTED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [
    OrderStatus.READY_FOR_PICKUP,
    OrderStatus.CANCELLED,
  ],
};

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private readonly orders: Repository<Order>,
    @InjectRepository(Merchant)
    private readonly merchants: Repository<Merchant>,
    @InjectRepository(Product) private readonly products: Repository<Product>,
    @InjectRepository(Promotion)
    private readonly promotions: Repository<Promotion>,
    private readonly dataSource: DataSource,
    private readonly rides: RidesService,
  ) {}

  async checkout(customerId: string, dto: CheckoutOrderDto): Promise<Order> {
    const merchant = await this.merchants.findOne({
      where: { id: dto.merchantId, status: MerchantStatus.ACTIVE },
    });
    if (!merchant) throw new NotFoundException('Merchant not found');
    if (!merchant.acceptingOrders) {
      throw new ForbiddenException('Merchant is not accepting orders');
    }
    if (merchant.lat == null || merchant.lng == null) {
      throw new BadRequestException('Merchant has no pickup location');
    }

    const quantityByProduct = new Map<string, number>();
    for (const item of dto.items) {
      const quantity =
        (quantityByProduct.get(item.productId) ?? 0) + item.quantity;
      if (quantity > 50) {
        throw new BadRequestException(
          'A product quantity cannot be greater than 50',
        );
      }
      quantityByProduct.set(item.productId, quantity);
    }
    const productIds = [...quantityByProduct.keys()];
    const products = await this.products.find({
      where: { id: In(productIds), merchantId: merchant.id, isAvailable: true },
    });
    if (products.length !== productIds.length) {
      throw new BadRequestException(
        'One or more products are unavailable or invalid',
      );
    }

    const lines = products.map((product) => {
      const quantity = quantityByProduct.get(product.id)!;
      return {
        product,
        quantity,
        lineTotal: product.price * quantity,
      };
    });
    const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
    if (subtotal < merchant.minimumOrderAmount) {
      throw new BadRequestException(
        `Minimum order is ${merchant.minimumOrderAmount} XOF`,
      );
    }
    const scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : undefined;
    if (scheduledAt && scheduledAt.getTime() <= Date.now()) {
      throw new BadRequestException('Scheduled time must be in the future');
    }

    const promotion = await this.bestPromotion(
      merchant.id,
      subtotal,
      merchant.deliveryFee,
    );
    const chargedDeliveryFee =
      merchant.deliveryFee - promotion.deliveryDiscount;
    const total = subtotal - promotion.productDiscount + chargedDeliveryFee;

    const orderId = await this.dataSource.transaction(async (manager) => {
      const order = await manager.save(
        manager.create(Order, {
          customerId,
          merchantId: merchant.id,
          status: OrderStatus.PENDING,
          subtotal,
          deliveryFee: chargedDeliveryFee,
          discountAmount: promotion.totalDiscount,
          promotionId: promotion.promotion?.id,
          promotionName: promotion.promotion?.name,
          total,
          paymentMethod: dto.paymentMethod ?? PaymentMethod.CASH,
          customerName: dto.customerName,
          customerPhone: dto.customerPhone,
          deliveryAddress: dto.deliveryAddress,
          deliveryLat: dto.deliveryLat,
          deliveryLng: dto.deliveryLng,
          note: dto.note,
          scheduledAt,
        }),
      );
      await manager.save(
        OrderItem,
        lines.map((line) =>
          manager.create(OrderItem, {
            orderId: order.id,
            productId: line.product.id,
            productName: line.product.name,
            unitPrice: line.product.price,
            quantity: line.quantity,
            lineTotal: line.lineTotal,
          }),
        ),
      );
      await manager.save(
        manager.create(OrderStatusHistory, {
          orderId: order.id,
          toStatus: OrderStatus.PENDING,
          actorUserId: customerId,
        }),
      );
      return order.id;
    });
    return this.customerOrder(customerId, orderId);
  }

  customerOrders(customerId: string): Promise<Order[]> {
    return this.orders.find({
      where: { customerId },
      relations: { merchant: true, items: true, ride: true },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async customerOrder(customerId: string, id: string): Promise<Order> {
    const order = await this.orders.findOne({
      where: { id, customerId },
      relations: { merchant: true, items: true, history: true, ride: true },
      order: { history: { createdAt: 'ASC' } },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async merchantOrders(userId: string): Promise<Order[]> {
    const merchants = await this.merchants.find({
      where: { ownerUserId: userId },
      select: { id: true },
    });
    if (merchants.length === 0) return [];
    return this.orders.find({
      where: { merchantId: In(merchants.map((merchant) => merchant.id)) },
      relations: { merchant: true, items: true, ride: true },
      order: { createdAt: 'DESC' },
      take: 200,
    });
  }

  async merchantAnalytics(userId: string, merchantId: string): Promise<{
    totalOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
    activeOrders: number;
    revenue: number;
    averageOrderValue: number;
    discountsGranted: number;
    dailyRevenue: { date: string; revenue: number; orders: number }[];
    topProducts: { name: string; quantity: number; revenue: number }[];
  }> {
    const merchant = await this.merchants.findOne({
      where: { id: merchantId, ownerUserId: userId },
      select: { id: true },
    });
    if (!merchant) throw new NotFoundException('Merchant not found');
    const orders = await this.orders.find({
      where: { merchantId },
      relations: { items: true },
      order: { createdAt: 'DESC' },
      take: 2000,
    });
    const delivered = orders.filter(
      (order) => order.status === OrderStatus.DELIVERED,
    );
    const cancelledOrders = orders.filter(
      (order) => order.status === OrderStatus.CANCELLED,
    ).length;
    const revenue = delivered.reduce((sum, order) => sum + order.total, 0);
    const discountsGranted = orders.reduce(
      (sum, order) => sum + (order.discountAmount ?? 0),
      0,
    );
    const daily = new Map<string, { revenue: number; orders: number }>();
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 6);
    for (let offset = 0; offset < 7; offset += 1) {
      const date = new Date(start);
      date.setDate(start.getDate() + offset);
      daily.set(date.toISOString().slice(0, 10), { revenue: 0, orders: 0 });
    }
    const products = new Map<
      string,
      { name: string; quantity: number; revenue: number }
    >();
    for (const order of delivered) {
      const day = order.createdAt.toISOString().slice(0, 10);
      const bucket = daily.get(day);
      if (bucket) {
        bucket.revenue += order.total;
        bucket.orders += 1;
      }
      for (const item of order.items ?? []) {
        const current = products.get(item.productName) ?? {
          name: item.productName,
          quantity: 0,
          revenue: 0,
        };
        current.quantity += item.quantity;
        current.revenue += item.lineTotal;
        products.set(item.productName, current);
      }
    }
    return {
      totalOrders: orders.length,
      deliveredOrders: delivered.length,
      cancelledOrders,
      activeOrders: orders.length - delivered.length - cancelledOrders,
      revenue,
      averageOrderValue:
        delivered.length === 0 ? 0 : Math.round(revenue / delivered.length),
      discountsGranted,
      dailyRevenue: [...daily.entries()].map(([date, value]) => ({
        date,
        ...value,
      })),
      topProducts: [...products.values()]
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5),
    };
  }

  async cancelByCustomer(customerId: string, id: string): Promise<Order> {
    const order = await this.orders.findOne({ where: { id, customerId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Only pending orders can be cancelled');
    }
    return this.transition(order, OrderStatus.CANCELLED, customerId);
  }

  async updateByMerchant(
    userId: string,
    id: string,
    dto: UpdateOrderStatusDto,
  ): Promise<Order> {
    const order = await this.orders.findOne({
      where: { id },
      relations: { merchant: true, items: true, ride: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.merchant.ownerUserId !== userId) {
      throw new NotFoundException('Order not found');
    }
    const allowed = MERCHANT_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot change order from ${order.status} to ${dto.status}`,
      );
    }

    if (dto.status === OrderStatus.READY_FOR_PICKUP) {
      const merchant = order.merchant;
      if (merchant.lat == null || merchant.lng == null) {
        throw new BadRequestException('Merchant has no pickup location');
      }
      const rideDto: RequestRideDto = {
        serviceType: ServiceType.MERCHANT_DELIVERY,
        pickup: {
          lat: merchant.lat,
          lng: merchant.lng,
          address: merchant.address,
        },
        dropoff: {
          lat: order.deliveryLat,
          lng: order.deliveryLng,
          address: order.deliveryAddress,
        },
        paymentMethod: order.paymentMethod as PaymentMethod,
      };
      const ride = await this.rides.request(order.customerId, rideDto, {
        merchantId: merchant.id,
        scheduledAt:
          order.scheduledAt && order.scheduledAt.getTime() > Date.now()
            ? order.scheduledAt
            : undefined,
        recipientName: order.customerName,
        recipientPhone: order.customerPhone,
        parcelDescription: `Commande ${order.id}`,
      });
      order.rideId = ride.id;
    }
    return this.transition(order, dto.status, userId, dto.note);
  }

  @OnEvent(RIDE_UPDATED)
  async onRideUpdated(event: RideUpdatedEvent): Promise<void> {
    const ride = event.ride;
    if (!ride.merchantId) return;
    const order = await this.orders.findOne({ where: { rideId: ride.id } });
    if (!order || order.status === OrderStatus.CANCELLED) return;
    const target = this.orderStatusForRide(ride.status);
    if (!target || order.status === target) return;
    await this.transition(order, target);
  }

  private orderStatusForRide(status: RideStatus): OrderStatus | undefined {
    switch (status) {
      case RideStatus.ACCEPTED:
        return OrderStatus.DRIVER_ASSIGNED;
      case RideStatus.IN_PROGRESS:
        return OrderStatus.PICKED_UP;
      case RideStatus.COMPLETED:
        return OrderStatus.DELIVERED;
      default:
        return undefined;
    }
  }

  private async bestPromotion(
    merchantId: string,
    subtotal: number,
    deliveryFee: number,
  ): Promise<{
    promotion?: Promotion;
    productDiscount: number;
    deliveryDiscount: number;
    totalDiscount: number;
  }> {
    const now = new Date();
    const promotions = await this.promotions.find({
      where: {
        merchantId,
        isActive: true,
        startsAt: LessThanOrEqual(now),
        endsAt: MoreThanOrEqual(now),
      },
    });
    let best: {
      promotion?: Promotion;
      productDiscount: number;
      deliveryDiscount: number;
      totalDiscount: number;
    } = { productDiscount: 0, deliveryDiscount: 0, totalDiscount: 0 };
    for (const promotion of promotions) {
      if (subtotal < promotion.minimumOrderAmount) continue;
      let productDiscount = 0;
      let deliveryDiscount = 0;
      if (promotion.type === PromotionType.PERCENTAGE) {
        productDiscount = Math.min(
          subtotal,
          Math.floor((subtotal * promotion.value) / 100),
        );
      } else if (promotion.type === PromotionType.FIXED_AMOUNT) {
        productDiscount = Math.min(subtotal, promotion.value);
      } else if (promotion.type === PromotionType.FREE_DELIVERY) {
        deliveryDiscount = deliveryFee;
      }
      const totalDiscount = productDiscount + deliveryDiscount;
      if (totalDiscount > best.totalDiscount) {
        best = {
          promotion,
          productDiscount,
          deliveryDiscount,
          totalDiscount,
        };
      }
    }
    return best;
  }

  private async transition(
    order: Order,
    status: OrderStatus,
    actorUserId?: string,
    note?: string,
  ): Promise<Order> {
    const fromStatus = order.status;
    order.status = status;
    const now = new Date();
    if (status === OrderStatus.ACCEPTED) order.acceptedAt = now;
    if (status === OrderStatus.PREPARING) order.preparingAt = now;
    if (status === OrderStatus.READY_FOR_PICKUP) order.readyAt = now;
    if (status === OrderStatus.PICKED_UP) order.pickedUpAt = now;
    if (status === OrderStatus.DELIVERED) order.deliveredAt = now;
    if (status === OrderStatus.CANCELLED) order.cancelledAt = now;
    const saved = await this.orders.save(order);
    await this.dataSource.getRepository(OrderStatusHistory).save({
      orderId: saved.id,
      fromStatus,
      toStatus: status,
      actorUserId,
      note,
    });
    return this.orders.findOneOrFail({
      where: { id: saved.id },
      relations: { merchant: true, items: true, ride: true },
    });
  }
}
