import { Injectable, Logger } from '@nestjs/common';
import { haversineMeters, LatLng } from '../../common/geo';
import { ServiceType } from '../../common/service-type';
import { MerchantsService } from '../merchants/merchants.service';
import { OrdersService } from '../orders/orders.service';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { RentalsService } from '../rentals/rentals.service';
import {
  RentalBooking,
  RentalStatus,
} from '../rentals/entities/rental-booking.entity';
import { Ride, RideStatus } from '../rides/entities/ride.entity';
import { RidesService } from '../rides/rides.service';
import { decodeCursor, encodeCursor } from './cursor.util';
import { ActivityQueryDto, FeedQueryDto, SearchQueryDto } from './dto/discovery-query.dto';
import {
  ActivityCursor,
  ActivityItem,
  ActivityResponse,
  ActivityStatusColor,
  FeedCursor,
  FeedItem,
  FeedResponse,
  SearchResults,
} from './discovery.types';

// City-centre fallback (Bamako) used when the caller has no location fix, so
// the nearby feed still ranks against a sensible origin.
const BAMAKO_CENTER: LatLng = { lat: 12.6392, lng: -8.0029 };

const DEFAULT_FEED_LIMIT = 15;
const DEFAULT_ACTIVITY_LIMIT = 15;
const MIN_SEARCH_LENGTH = 2;

@Injectable()
export class DiscoveryService {
  private readonly logger = new Logger(DiscoveryService.name);

  constructor(
    private readonly merchants: MerchantsService,
    private readonly rides: RidesService,
    private readonly rentals: RentalsService,
    private readonly orders: OrdersService,
  ) {}

  // 1) Location-first nearby feed. Active merchants ranked by distance to the
  // caller, paginated by an opaque {distance,id} cursor for a stable order.
  async feed(dto: FeedQueryDto): Promise<FeedResponse> {
    const origin = this.resolveOrigin(dto.lat, dto.lng);
    const limit = dto.limit ?? DEFAULT_FEED_LIMIT;
    const cursor = dto.cursor ? decodeCursor<FeedCursor>(dto.cursor) : null;

    const [merchants, promotions] = await Promise.all([
      this.settled(() => this.merchants.activeMerchants(), 'feed:merchants', []),
      this.settled(
        () => this.merchants.featuredPromotions(),
        'feed:promotions',
        [],
      ),
    ]);

    const offerByMerchant = new Map<string, string>();
    for (const promo of promotions) {
      if (promo.merchantId && !offerByMerchant.has(promo.merchantId)) {
        offerByMerchant.set(promo.merchantId, promo.name);
      }
    }

    const ranked = merchants
      .filter((m) => m.lat != null && m.lng != null)
      .map((m) => ({
        merchant: m,
        distance: Math.round(
          haversineMeters(origin, { lat: m.lat!, lng: m.lng! }),
        ),
      }))
      .sort((a, b) =>
        a.distance !== b.distance
          ? a.distance - b.distance
          : a.merchant.id < b.merchant.id
            ? -1
            : 1,
      );

    const afterCursor = cursor
      ? ranked.filter(
          (r) =>
            r.distance > cursor.distance ||
            (r.distance === cursor.distance && r.merchant.id > cursor.id),
        )
      : ranked;

    const page = afterCursor.slice(0, limit);
    const previews = await this.settled(
      () => this.merchants.previewProducts(page.map((r) => r.merchant.id)),
      'feed:previews',
      new Map(),
    );

    const items: FeedItem[] = page.map((r) => ({
      type: 'merchant',
      id: r.merchant.id,
      name: r.merchant.name,
      logoUrl: r.merchant.logoUrl ?? null,
      category: r.merchant.type,
      distanceMeters: r.distance,
      offerBadge: offerByMerchant.get(r.merchant.id),
      previewProducts: (previews.get(r.merchant.id) ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        imageUrl: p.imageUrl ?? null,
      })),
    }));

    const last = page[page.length - 1];
    const nextCursor =
      afterCursor.length > page.length && last
        ? encodeCursor({
            distance: last.distance,
            id: last.merchant.id,
          } satisfies FeedCursor)
        : null;

    return { items, nextCursor };
  }

  // 2) One search across verticals. Grouped Meituan-style so each section can
  // deep-link into the existing catalog/booking screens.
  async search(dto: SearchQueryDto): Promise<SearchResults> {
    const q = (dto.q ?? '').trim();
    if (q.length < MIN_SEARCH_LENGTH) {
      return { merchants: [], dishes: [], rentals: [] };
    }
    const origin =
      dto.lat != null && dto.lng != null
        ? { lat: dto.lat, lng: dto.lng }
        : null;

    const [merchants, products, vehicles] = await Promise.all([
      this.settled(() => this.merchants.searchMerchants(q), 'search:merchants', []),
      this.settled(() => this.merchants.searchProducts(q), 'search:products', []),
      this.settled(() => this.rentals.searchVehicles(q), 'search:rentals', []),
    ]);

    return {
      merchants: merchants.map((m) => ({
        id: m.id,
        name: m.name,
        logoUrl: m.logoUrl ?? null,
        category: m.type,
        distanceMeters:
          origin && m.lat != null && m.lng != null
            ? Math.round(haversineMeters(origin, { lat: m.lat, lng: m.lng }))
            : null,
      })),
      dishes: products.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        imageUrl: p.imageUrl ?? null,
        merchantId: p.merchantId,
        merchantName: p.merchant?.name ?? null,
      })),
      rentals: vehicles.map((v) => ({
        id: v.id,
        name: v.name,
        category: v.category,
        dailyPrice: Number(v.dailyPrice),
        imageUrl: v.imageUrl ?? null,
      })),
    };
  }

  // 3) Unified orders timeline. Fans out to rides/orders/rentals, normalizes to
  // a common shape, merge-sorts by createdAt desc, and paginates.
  async activity(userId: string, dto: ActivityQueryDto): Promise<ActivityResponse> {
    const limit = dto.limit ?? DEFAULT_ACTIVITY_LIMIT;
    const filter = dto.filter ?? 'all';
    const cursor = dto.cursor ? decodeCursor<ActivityCursor>(dto.cursor) : null;

    const wantRide = filter === 'all' || filter === 'ride';
    const wantFood = filter === 'all' || filter === 'food';
    const wantRental = filter === 'all' || filter === 'rental';

    const [rides, orders, bookings] = await Promise.all([
      wantRide
        ? this.settled(() => this.rides.list(userId), 'activity:rides', [])
        : Promise.resolve<Ride[]>([]),
      wantFood
        ? this.settled(
            () => this.orders.customerOrders(userId),
            'activity:orders',
            [],
          )
        : Promise.resolve<Order[]>([]),
      wantRental
        ? this.settled(
            () => this.rentals.myBookings(userId),
            'activity:rentals',
            [],
          )
        : Promise.resolve<RentalBooking[]>([]),
    ]);

    const items: ActivityItem[] = [
      // Merchant deliveries are surfaced as their food order, not twice.
      ...rides
        .filter((r) => r.serviceType !== ServiceType.MERCHANT_DELIVERY)
        .map((r) => this.normalizeRide(r)),
      ...orders.map((o) => this.normalizeOrder(o)),
      ...bookings.map((b) => this.normalizeBooking(b)),
    ].sort(compareActivityDesc);

    const afterCursor = cursor
      ? items.filter((item) => isAfterCursor(item, cursor))
      : items;
    const page = afterCursor.slice(0, limit);
    const last = page[page.length - 1];
    const nextCursor =
      afterCursor.length > page.length && last
        ? encodeCursor({
            createdAt: last.createdAt,
            type: last.type,
            id: last.id,
          } satisfies ActivityCursor)
        : null;

    return { items: page, nextCursor };
  }

  // --- normalization ---

  private normalizeRide(ride: Ride): ActivityItem {
    return {
      type: 'ride',
      id: ride.id,
      title: RIDE_TITLES[ride.serviceType] ?? 'Course',
      statusLabel: RIDE_STATUS_LABELS[ride.status] ?? ride.status,
      statusColor: RIDE_STATUS_COLORS[ride.status] ?? 'neutral',
      createdAt: ride.createdAt.toISOString(),
      amountLabel: formatAmount(ride.fareAmount, ride.currency),
      deepLink: `/rides/${ride.id}`,
    };
  }

  private normalizeOrder(order: Order): ActivityItem {
    return {
      type: 'food',
      id: order.id,
      title: order.merchant?.name ?? 'Commande',
      statusLabel: ORDER_STATUS_LABELS[order.status] ?? order.status,
      statusColor: ORDER_STATUS_COLORS[order.status] ?? 'neutral',
      createdAt: order.createdAt.toISOString(),
      amountLabel: formatAmount(order.total, 'XOF'),
      deepLink: `/orders/${order.id}`,
    };
  }

  private normalizeBooking(booking: RentalBooking): ActivityItem {
    return {
      type: 'rental',
      id: booking.id,
      title: booking.vehicleName,
      statusLabel: RENTAL_STATUS_LABELS[booking.status] ?? booking.status,
      statusColor: RENTAL_STATUS_COLORS[booking.status] ?? 'neutral',
      createdAt: booking.createdAt.toISOString(),
      amountLabel: formatAmount(booking.totalAmount, booking.currency),
      deepLink: `/rentals/bookings/${booking.id}`,
    };
  }

  // --- helpers ---

  private resolveOrigin(lat?: number, lng?: number): LatLng {
    return lat != null && lng != null ? { lat, lng } : BAMAKO_CENTER;
  }

  // Run a single source with allSettled semantics: a rejection is logged and
  // swapped for a fallback so one failing vertical never blanks the surface.
  private async settled<T>(
    task: () => Promise<T>,
    label: string,
    fallback: T,
  ): Promise<T> {
    const [result] = await Promise.allSettled([task()]);
    if (result.status === 'fulfilled') return result.value;
    this.logger.warn(`discovery source failed (${label}): ${String(result.reason)}`);
    return fallback;
  }
}

// --- pure module-level helpers & label maps ---

const RIDE_TITLES: Record<ServiceType, string> = {
  [ServiceType.RIDE_CAR]: 'Course',
  [ServiceType.MOTO]: 'Moto-taxi',
  [ServiceType.PARCEL]: 'Colis',
  [ServiceType.MERCHANT_DELIVERY]: 'Livraison',
};

const RIDE_STATUS_LABELS: Record<RideStatus, string> = {
  [RideStatus.REQUESTED]: 'En recherche',
  [RideStatus.ACCEPTED]: 'Chauffeur assigné',
  [RideStatus.IN_PROGRESS]: 'En cours',
  [RideStatus.COMPLETED]: 'Terminé',
  [RideStatus.CANCELLED]: 'Annulé',
  [RideStatus.NO_DRIVER]: 'Aucun chauffeur',
};

const RIDE_STATUS_COLORS: Record<RideStatus, ActivityStatusColor> = {
  [RideStatus.REQUESTED]: 'neutral',
  [RideStatus.ACCEPTED]: 'info',
  [RideStatus.IN_PROGRESS]: 'info',
  [RideStatus.COMPLETED]: 'success',
  [RideStatus.CANCELLED]: 'danger',
  [RideStatus.NO_DRIVER]: 'danger',
};

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'En attente',
  [OrderStatus.ACCEPTED]: 'Acceptée',
  [OrderStatus.PREPARING]: 'En préparation',
  [OrderStatus.READY_FOR_PICKUP]: 'Prête',
  [OrderStatus.DRIVER_ASSIGNED]: 'Chauffeur assigné',
  [OrderStatus.PICKED_UP]: 'En livraison',
  [OrderStatus.DELIVERED]: 'Livrée',
  [OrderStatus.CANCELLED]: 'Annulée',
};

const ORDER_STATUS_COLORS: Record<OrderStatus, ActivityStatusColor> = {
  [OrderStatus.PENDING]: 'neutral',
  [OrderStatus.ACCEPTED]: 'info',
  [OrderStatus.PREPARING]: 'info',
  [OrderStatus.READY_FOR_PICKUP]: 'info',
  [OrderStatus.DRIVER_ASSIGNED]: 'info',
  [OrderStatus.PICKED_UP]: 'info',
  [OrderStatus.DELIVERED]: 'success',
  [OrderStatus.CANCELLED]: 'danger',
};

const RENTAL_STATUS_LABELS: Record<RentalStatus, string> = {
  [RentalStatus.REQUESTED]: 'Demandée',
  [RentalStatus.ACCEPTED]: 'Acceptée',
  [RentalStatus.IN_PROGRESS]: 'En cours',
  [RentalStatus.COMPLETED]: 'Terminée',
  [RentalStatus.CANCELLED]: 'Annulée',
  [RentalStatus.NO_DRIVER]: 'Indisponible',
};

const RENTAL_STATUS_COLORS: Record<RentalStatus, ActivityStatusColor> = {
  [RentalStatus.REQUESTED]: 'neutral',
  [RentalStatus.ACCEPTED]: 'info',
  [RentalStatus.IN_PROGRESS]: 'info',
  [RentalStatus.COMPLETED]: 'success',
  [RentalStatus.CANCELLED]: 'danger',
  [RentalStatus.NO_DRIVER]: 'danger',
};

// Whole-XOF amount grouped in thousands, e.g. 12500 -> "12 500 XOF".
function formatAmount(amount: number | string, currency: string): string {
  const value = Math.round(Number(amount) || 0);
  const grouped = value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${grouped} ${currency}`;
}

// Total order over the merged timeline: createdAt desc, then type asc, id asc.
function compareActivityDesc(a: ActivityItem, b: ActivityItem): number {
  const delta = Date.parse(b.createdAt) - Date.parse(a.createdAt);
  if (delta !== 0) return delta;
  if (a.type !== b.type) return a.type < b.type ? -1 : 1;
  return a.id < b.id ? -1 : 1;
}

// True when `item` sorts strictly after `cursor` in the timeline order above.
function isAfterCursor(item: ActivityItem, cursor: ActivityCursor): boolean {
  const t = Date.parse(item.createdAt);
  const ct = Date.parse(cursor.createdAt);
  if (t !== ct) return t < ct;
  if (item.type !== cursor.type) return item.type > cursor.type;
  return item.id > cursor.id;
}
