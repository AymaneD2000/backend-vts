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
import { ServiceType } from '../../../common/service-type';
import { TrustLevel } from '../../../common/trust-level';
import { User } from '../../users/entities/user.entity';

export enum ParcelSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
}

export enum RideStatus {
  REQUESTED = 'requested', // matched driver, awaiting accept
  ACCEPTED = 'accepted', // driver on the way to pickup
  IN_PROGRESS = 'in_progress', // trip started
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_DRIVER = 'no_driver', // no available driver found
}

export enum PaymentMethod {
  CASH = 'cash',
  MOBILE_MONEY = 'mobile_money',
}

// Who initiated the cancellation.
export enum CancelledBy {
  CLIENT = 'client',
  DRIVER = 'driver',
}

// Structured reasons so cancellations can be analysed (and later drive fees).
export enum CancelReason {
  CHANGED_MIND = 'changed_mind',
  DRIVER_TOO_FAR = 'driver_too_far',
  WAIT_TOO_LONG = 'wait_too_long',
  WRONG_ADDRESS = 'wrong_address',
  CLIENT_NO_SHOW = 'client_no_show',
  CLIENT_UNREACHABLE = 'client_unreachable',
  PRICE = 'price',
  OTHER = 'other',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
}

// Central transactional table for Course Voiture, Moto-taxi and Colis
// (architecture doc: courses_livraisons). type_service drives pricing rules.
@Entity('rides')
export class Ride {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'service_type', type: 'enum', enum: ServiceType })
  serviceType: ServiceType;

  @Index()
  @Column({ type: 'enum', enum: RideStatus, default: RideStatus.REQUESTED })
  status: RideStatus;

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

  @Column({ name: 'pickup_lat', type: 'double precision' })
  pickupLat: number;

  @Column({ name: 'pickup_lng', type: 'double precision' })
  pickupLng: number;

  @Column({ name: 'pickup_address', nullable: true })
  pickupAddress?: string;

  @Column({ name: 'dropoff_lat', type: 'double precision' })
  dropoffLat: number;

  @Column({ name: 'dropoff_lng', type: 'double precision' })
  dropoffLng: number;

  @Column({ name: 'dropoff_address', nullable: true })
  dropoffAddress?: string;

  @Column({ name: 'distance_m', type: 'int' })
  distanceM: number;

  @Column({ name: 'duration_s', type: 'int' })
  durationS: number;

  @Column({ name: 'fare_amount', type: 'int' })
  fareAmount: number;

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

  // Merchant deliveries can be prepared in advance. They stay invisible to
  // drivers until scheduled_at is reached or the merchant launches them.
  @Index()
  @Column({ name: 'scheduled_at', type: 'timestamptz', nullable: true })
  scheduledAt?: Date;

  @Column({ name: 'dispatched_at', type: 'timestamptz', nullable: true })
  dispatchedAt?: Date;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt?: Date;

  @Column({
    name: 'cancelled_by',
    type: 'enum',
    enum: CancelledBy,
    nullable: true,
  })
  cancelledBy?: CancelledBy;

  @Column({
    name: 'cancel_reason',
    type: 'enum',
    enum: CancelReason,
    nullable: true,
  })
  cancelReason?: CancelReason;

  @Column({ name: 'cancel_note', type: 'text', nullable: true })
  cancelNote?: string;

  // --- Parcel (Colis) fields, only set when serviceType === PARCEL ---

  // Declared value of the parcel in FCFA; drives the required trust level.
  @Column({
    name: 'declared_value',
    type: 'numeric',
    precision: 12,
    scale: 0,
    nullable: true,
  })
  declaredValue?: number;

  @Column({ name: 'parcel_description', type: 'text', nullable: true })
  parcelDescription?: string;

  @Column({ name: 'recipient_name', nullable: true })
  recipientName?: string;

  @Column({ name: 'recipient_phone', length: 20, nullable: true })
  recipientPhone?: string;

  @Column({
    name: 'parcel_size',
    type: 'enum',
    enum: ParcelSize,
    nullable: true,
  })
  parcelSize?: ParcelSize;

  // Minimum driver trust level required to carry this parcel (derived from the
  // declared value via the admin-configured caps at request time).
  @Column({
    name: 'required_trust_level',
    type: 'smallint',
    nullable: true,
  })
  requiredTrustLevel?: TrustLevel;

  // Set when this ride is a merchant delivery: the store/restaurant it pickups
  // from. Null for ordinary rides/parcels.
  @Index()
  @Column({ name: 'merchant_id', type: 'uuid', nullable: true })
  merchantId?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
