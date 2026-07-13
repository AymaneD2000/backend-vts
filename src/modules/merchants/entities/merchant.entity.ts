import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

// Kind of business dispatching deliveries through the app.
export enum MerchantType {
  STORE = 'store',
  RESTAURANT = 'restaurant',
}

// Lifecycle of a merchant account. Only ACTIVE merchants can dispatch.
export enum MerchantStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
}

// A store/restaurant the admin registers. Its owner (a User) gets the
// `merchant` role and can request deliveries from the shop's location.
@Entity('merchants')
export class Merchant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: MerchantType })
  type: MerchantType;

  // The User who manages this merchant (granted the `merchant` role).
  @Index()
  @Column({ name: 'owner_user_id', type: 'uuid', nullable: true })
  ownerUserId?: string;

  @Column({ length: 20, nullable: true })
  phone?: string;

  @Column({ nullable: true })
  address?: string;

  // Public branding image, stored separately from private KYC documents.
  @Column({ name: 'logo_url', nullable: true })
  logoUrl?: string;

  // Shop location — used as the pickup point for deliveries.
  @Column({ type: 'double precision', nullable: true })
  lat?: number;

  @Column({ type: 'double precision', nullable: true })
  lng?: number;

  @Index()
  @Column({
    type: 'enum',
    enum: MerchantStatus,
    default: MerchantStatus.PENDING,
  })
  status: MerchantStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
