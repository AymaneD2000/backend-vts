import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { CancelledBy, PaymentMethod, PaymentStatus } from '../../rides/entities/ride.entity';
import { RentalCategory, RentalVehicle } from './rental-vehicle.entity';

// Lifecycle of a rental order. Mirrors RideStatus so the accept/start/complete
// dispatch flow is consistent across the app.
export enum RentalStatus {
  REQUESTED = 'requested', // awaiting a driver/provider to accept
  ACCEPTED = 'accepted',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_DRIVER = 'no_driver',
}

// A client's rental order. The vehicle name/category/price are snapshotted so a
// later catalog edit never rewrites the history of an existing booking.
@Entity('rental_bookings')
export class RentalBooking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RentalVehicle, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle?: RentalVehicle;

  @Index()
  @Column({ name: 'vehicle_id', type: 'uuid', nullable: true })
  vehicleId?: string;

  @Column({ name: 'vehicle_name' })
  vehicleName: string;

  @Column({ type: 'enum', enum: RentalCategory })
  category: RentalCategory;

  @Column({ name: 'daily_price', type: 'numeric', precision: 12, scale: 0 })
  dailyPrice: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client: User;

  @Index()
  @Column({ name: 'client_id' })
  clientId: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'driver_id' })
  driver?: User;

  @Index()
  @Column({ name: 'driver_id', nullable: true })
  driverId?: string;

  @Index()
  @Column({ type: 'enum', enum: RentalStatus, default: RentalStatus.REQUESTED })
  status: RentalStatus;

  @Column({ name: 'start_date', type: 'date' })
  startDate: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate: string;

  @Column({ type: 'int' })
  days: number;

  // Optional delivery / meeting point for the vehicle.
  @Column({ name: 'pickup_lat', type: 'double precision', nullable: true })
  pickupLat?: number;

  @Column({ name: 'pickup_lng', type: 'double precision', nullable: true })
  pickupLng?: number;

  @Column({ name: 'pickup_address', nullable: true })
  pickupAddress?: string;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @Column({ name: 'total_amount', type: 'numeric', precision: 12, scale: 0 })
  totalAmount: number;

  @Column({ default: 'XOF' })
  currency: string;

  @Column({
    name: 'payment_method',
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.CASH,
  })
  paymentMethod: PaymentMethod;

  @Column({
    name: 'payment_status',
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;

  @Column({ name: 'accepted_at', type: 'timestamptz', nullable: true })
  acceptedAt?: Date;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt?: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt?: Date;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt?: Date;

  @Column({
    name: 'cancelled_by',
    type: 'enum',
    enum: CancelledBy,
    nullable: true,
  })
  cancelledBy?: CancelledBy;

  @Column({ name: 'cancel_note', type: 'text', nullable: true })
  cancelNote?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
