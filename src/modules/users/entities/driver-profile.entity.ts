import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TrustLevel } from '../../../common/trust-level';
import { User } from './user.entity';

export enum KycStatus {
  PENDING = 'pending',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum VehicleType {
  CAR = 'car',
  MOTO = 'moto',
}

// Driver-specific information kept separate from the base User identity
// (see architecture doc: profils_chauffeur). KYC, availability and position.
@Entity('driver_profiles')
export class DriverProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.driverProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({
    name: 'kyc_status',
    type: 'enum',
    enum: KycStatus,
    default: KycStatus.PENDING,
  })
  kycStatus: KycStatus;

  // Set when an admin rejects the submission, shown to the driver.
  @Column({ name: 'kyc_rejection_reason', type: 'text', nullable: true })
  kycRejectionReason?: string;

  // Materialized trust tier, recomputed by TrustService on any change to the
  // driver's KYC status, guarantor or partner-company link. Drives which
  // parcels (by declared value) the driver may be offered.
  @Column({
    name: 'trust_level',
    type: 'smallint',
    default: TrustLevel.NONE,
  })
  trustLevel: TrustLevel;

  // Individual guarantor who referred this driver (Level 2), if any.
  @Column({ name: 'guarantor_id', type: 'uuid', nullable: true })
  guarantorId?: string;

  // Partner company this driver belongs to (Level 3), if any.
  @Column({ name: 'partner_company_id', type: 'uuid', nullable: true })
  partnerCompanyId?: string;

  @Column({
    name: 'vehicle_type',
    type: 'enum',
    enum: VehicleType,
    nullable: true,
  })
  vehicleType?: VehicleType;

  @Column({ name: 'vehicle_plate', nullable: true })
  vehiclePlate?: string;

  @Column({ name: 'vehicle_make', nullable: true })
  vehicleMake?: string;

  @Column({ name: 'vehicle_model', nullable: true })
  vehicleModel?: string;

  @Column({ name: 'vehicle_color', nullable: true })
  vehicleColor?: string;

  @Column({ name: 'vehicle_year', type: 'smallint', nullable: true })
  vehicleYear?: number;

  @Column({ name: 'is_available', default: false })
  isAvailable: boolean;

  // Live position is kept in Redis for matching; these columns store the
  // last known position for persistence / admin views.
  @Column({ name: 'last_lat', type: 'double precision', nullable: true })
  lastLat?: number;

  @Column({ name: 'last_lng', type: 'double precision', nullable: true })
  lastLng?: number;

  @Column({ name: 'rating_avg', type: 'numeric', precision: 3, scale: 2, default: 0 })
  ratingAvg: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
