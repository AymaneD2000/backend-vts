import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import {
  CancelledBy,
  PaymentMethod,
  PaymentStatus,
} from '../rides/entities/ride.entity';
import { RENTAL_UPDATED, RentalUpdatedEvent } from './rental-events';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { CreateRentalVehicleDto } from './dto/create-rental-vehicle.dto';
import { UpdateRentalVehicleDto } from './dto/update-rental-vehicle.dto';
import {
  RentalBooking,
  RentalStatus,
} from './entities/rental-booking.entity';
import {
  RentalCategory,
  RentalVehicle,
} from './entities/rental-vehicle.entity';

const ACTIVE_STATUSES = [
  RentalStatus.REQUESTED,
  RentalStatus.ACCEPTED,
  RentalStatus.IN_PROGRESS,
];

// Catalog seeded on first boot so the rental list isn't empty. Admins edit/add
// from the panel thereafter; seeding is keyed by name so it stays idempotent.
const DEFAULT_VEHICLES: Array<{
  name: string;
  category: RentalCategory;
  dailyPrice: number;
  description: string;
}> = [
  {
    name: 'Moto 125cc',
    category: RentalCategory.MOTO,
    dailyPrice: 10000,
    description: 'Moto pratique pour les déplacements en ville.',
  },
  {
    name: 'Berline 4 places',
    category: RentalCategory.CAR,
    dailyPrice: 35000,
    description: 'Voiture confortable pour événements et trajets.',
  },
  {
    name: 'Tricycle 3 roues',
    category: RentalCategory.TRICYCLE,
    dailyPrice: 15000,
    description: 'Moto à 3 roues pour le transport de charges.',
  },
];

@Injectable()
export class RentalsService implements OnModuleInit {
  constructor(
    @InjectRepository(RentalVehicle)
    private readonly vehicles: Repository<RentalVehicle>,
    @InjectRepository(RentalBooking)
    private readonly bookings: Repository<RentalBooking>,
    private readonly events: EventEmitter2,
  ) {}

  // Notify listeners (push notifications) that a booking changed state.
  private emitUpdated(booking: RentalBooking): void {
    this.events.emit(RENTAL_UPDATED, { booking } satisfies RentalUpdatedEvent);
  }

  // Idempotently seed a starter catalog so a fresh database is usable.
  async onModuleInit(): Promise<void> {
    for (const v of DEFAULT_VEHICLES) {
      const existing = await this.vehicles.findOne({ where: { name: v.name } });
      if (!existing) {
        await this.vehicles.save(this.vehicles.create(v));
      }
    }
  }

  // --- Admin: vehicle catalog ---

  createVehicle(dto: CreateRentalVehicleDto): Promise<RentalVehicle> {
    return this.vehicles.save(this.vehicles.create(dto));
  }

  listVehicles(): Promise<RentalVehicle[]> {
    return this.vehicles.find({ order: { createdAt: 'DESC' } });
  }

  async updateVehicle(
    id: string,
    dto: UpdateRentalVehicleDto,
  ): Promise<RentalVehicle> {
    const vehicle = await this.vehicles.findOne({ where: { id } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    Object.assign(vehicle, dto);
    return this.vehicles.save(vehicle);
  }

  listBookings(): Promise<RentalBooking[]> {
    return this.bookings.find({ order: { createdAt: 'DESC' }, take: 200 });
  }

  // --- Client ---

  // Only the vehicles the admin has marked available appear in the catalog.
  // Each is decorated with `availableUnits` = quantity minus the number of
  // units currently held by active bookings, so the client can grey out any
  // vehicle whose units are all taken.
  async listCatalog(): Promise<
    Array<RentalVehicle & { availableUnits: number }>
  > {
    const vehicles = await this.vehicles.find({
      where: { isAvailable: true },
      order: { dailyPrice: 'ASC' },
    });
    const counts = await this.activeCounts(vehicles.map((v) => v.id));
    return vehicles.map((v) => ({
      ...v,
      availableUnits: Math.max(0, v.quantity - (counts.get(v.id) ?? 0)),
    }));
  }

  // Count active (non-terminal) bookings per vehicle, keyed by vehicle id.
  private async activeCounts(
    vehicleIds: string[],
  ): Promise<Map<string, number>> {
    const counts = new Map<string, number>();
    if (vehicleIds.length === 0) return counts;
    const rows = await this.bookings
      .createQueryBuilder('b')
      .select('b.vehicleId', 'vehicleId')
      .addSelect('COUNT(*)', 'count')
      .where('b.vehicleId IN (:...vehicleIds)', { vehicleIds })
      .andWhere('b.status IN (:...statuses)', { statuses: ACTIVE_STATUSES })
      .groupBy('b.vehicleId')
      .getRawMany<{ vehicleId: string; count: string }>();
    for (const row of rows) counts.set(row.vehicleId, Number(row.count));
    return counts;
  }

  // Units of a single vehicle currently held by active bookings.
  private activeCountFor(vehicleId: string): Promise<number> {
    return this.bookings.count({
      where: { vehicleId, status: In(ACTIVE_STATUSES) },
    });
  }

  async book(clientId: string, dto: CreateBookingDto): Promise<RentalBooking> {
    const vehicle = await this.vehicles.findOne({
      where: { id: dto.vehicleId },
    });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    if (!vehicle.isAvailable) {
      throw new BadRequestException('Vehicle is not available');
    }
    // Reject when every unit is already held by an active booking.
    const activeCount = await this.activeCountFor(vehicle.id);
    if (activeCount >= vehicle.quantity) {
      throw new BadRequestException('Vehicle is fully booked');
    }

    const days = this.computeDays(dto.startDate, dto.endDate);
    // Snapshot price/name/category so a later catalog edit never rewrites the
    // history of this booking.
    const totalAmount = vehicle.dailyPrice * days;

    const booking = this.bookings.create({
      vehicleId: vehicle.id,
      vehicleName: vehicle.name,
      category: vehicle.category,
      dailyPrice: vehicle.dailyPrice,
      clientId,
      status: RentalStatus.REQUESTED,
      startDate: dto.startDate,
      endDate: dto.endDate,
      days,
      pickupLat: dto.pickupLat,
      pickupLng: dto.pickupLng,
      pickupAddress: dto.pickupAddress,
      note: dto.note,
      totalAmount,
      currency: 'XOF',
      paymentMethod: dto.paymentMethod ?? PaymentMethod.CASH,
      paymentStatus: PaymentStatus.PENDING,
    });
    const saved = await this.bookings.save(booking);
    this.emitUpdated(saved);
    return saved;
  }

  myBookings(clientId: string): Promise<RentalBooking[]> {
    return this.bookings.find({
      where: [{ clientId }, { driverId: clientId }],
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async get(id: string, userId: string): Promise<RentalBooking> {
    const booking = await this.getOrThrow(id);
    if (booking.clientId !== userId && booking.driverId !== userId) {
      throw new ForbiddenException('Not your booking');
    }
    return booking;
  }

  async cancel(
    id: string,
    userId: string,
    dto: CancelBookingDto = {},
  ): Promise<RentalBooking> {
    const booking = await this.getOrThrow(id);
    if (booking.clientId !== userId && booking.driverId !== userId) {
      throw new ForbiddenException('Not your booking');
    }
    if (!ACTIVE_STATUSES.includes(booking.status)) {
      throw new BadRequestException(`Cannot cancel a ${booking.status} booking`);
    }
    booking.status = RentalStatus.CANCELLED;
    booking.cancelledAt = new Date();
    booking.cancelledBy =
      booking.clientId === userId ? CancelledBy.CLIENT : CancelledBy.DRIVER;
    booking.cancelNote = dto.note;
    const saved = await this.bookings.save(booking);
    this.emitUpdated(saved);
    return saved;
  }

  // --- Driver ---

  // Pending bookings awaiting a driver. Any verified driver may claim one.
  listPending(): Promise<RentalBooking[]> {
    return this.bookings.find({
      where: { status: RentalStatus.REQUESTED, driverId: IsNull() },
      order: { createdAt: 'ASC' },
      take: 50,
    });
  }

  async accept(id: string, driverId: string): Promise<RentalBooking> {
    // Atomic claim: only one driver can flip a still-pending booking to accepted.
    // Concurrent accepts race at the database and exactly one wins.
    const result = await this.bookings.update(
      { id, status: RentalStatus.REQUESTED, driverId: IsNull() },
      { status: RentalStatus.ACCEPTED, driverId, acceptedAt: new Date() },
    );
    if (result.affected === 0) {
      const existing = await this.bookings.findOne({ where: { id } });
      if (!existing) throw new NotFoundException('Booking not found');
      throw new ConflictException('Booking is no longer available');
    }
    const booking = await this.getOrThrow(id);
    this.emitUpdated(booking);
    return booking;
  }

  async start(id: string, driverId: string): Promise<RentalBooking> {
    const booking = await this.getOrThrow(id);
    this.assertDriver(booking, driverId);
    if (booking.status !== RentalStatus.ACCEPTED) {
      throw new BadRequestException(`Cannot start a ${booking.status} booking`);
    }
    booking.status = RentalStatus.IN_PROGRESS;
    booking.startedAt = new Date();
    const saved = await this.bookings.save(booking);
    this.emitUpdated(saved);
    return saved;
  }

  async complete(id: string, driverId: string): Promise<RentalBooking> {
    const booking = await this.getOrThrow(id);
    this.assertDriver(booking, driverId);
    if (booking.status !== RentalStatus.IN_PROGRESS) {
      throw new BadRequestException(
        `Cannot complete a ${booking.status} booking`,
      );
    }
    booking.status = RentalStatus.COMPLETED;
    booking.completedAt = new Date();
    // Cash is settled in person; mark it paid on completion (mirrors rides).
    if (booking.paymentMethod === PaymentMethod.CASH) {
      booking.paymentStatus = PaymentStatus.PAID;
    }
    const saved = await this.bookings.save(booking);
    this.emitUpdated(saved);
    return saved;
  }

  // Inclusive day count over [startDate, endDate], minimum 1 day.
  private computeDays(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid dates');
    }
    if (end < start) {
      throw new BadRequestException('End date must be after start date');
    }
    const ms = end.getTime() - start.getTime();
    return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)) + 1);
  }

  private assertDriver(booking: RentalBooking, driverId: string): void {
    if (booking.driverId !== driverId) {
      throw new ForbiddenException('Not the assigned driver');
    }
  }

  private async getOrThrow(id: string): Promise<RentalBooking> {
    const booking = await this.bookings.findOne({ where: { id } });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }
}
