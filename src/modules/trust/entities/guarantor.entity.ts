import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

// An individual trusted person registered by an admin who can vouch for
// (refer) drivers. Once verified, drivers linked to this guarantor reach
// trust Level 2 and may carry higher-value parcels; the guarantor is the
// legally/financially responsible party in case of loss or damage.
@Entity('guarantors')
export class Guarantor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Optional link to a platform user account (a guarantor may also be a user).
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId?: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Index()
  @Column({ length: 20 })
  phone: string;

  // National ID number on file for accountability.
  @Column({ name: 'id_number', nullable: true })
  idNumber?: string;

  // Admin flips this true after reviewing documents/warranty. Only verified
  // guarantors confer trust on the drivers they refer.
  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
