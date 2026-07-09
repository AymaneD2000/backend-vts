import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DriverProfile } from './driver-profile.entity';

export enum UserRole {
  CLIENT = 'client',
  DRIVER = 'driver',
  ADMIN = 'admin',
  // Individual trusted person who can vouch for (refer) drivers.
  GUARANTOR = 'guarantor',
  // Manager of a partner company whose drivers inherit its trust level.
  PARTNER = 'partner',
  // Owner of a store/restaurant who can dispatch deliveries.
  MERCHANT = 'merchant',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Phone is the primary identity in the Mali context (OTP login).
  @Index({ unique: true })
  @Column({ length: 20 })
  phone: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ name: 'full_name', nullable: true })
  fullName?: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    array: true,
    default: [UserRole.CLIENT],
  })
  roles: UserRole[];

  @Column({ name: 'phone_verified', default: false })
  phoneVerified: boolean;

  // Optional password (argon2 hash). Many users will only use OTP.
  @Column({ name: 'password_hash', nullable: true, select: false })
  passwordHash?: string;

  // Hash of the current refresh token, for rotation/invalidation.
  @Column({ name: 'refresh_token_hash', nullable: true, select: false })
  refreshTokenHash?: string;

  @OneToOne(() => DriverProfile, (profile) => profile.user)
  driverProfile?: DriverProfile;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
