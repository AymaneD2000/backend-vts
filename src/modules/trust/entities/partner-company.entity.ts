import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

// Distinguishes the nature of a company's relationship with the platform.
// A subscriber has a commercial (paid) relationship; a guarantor takes legal
// responsibility for its drivers; BOTH covers companies that do both.
export enum CompanyType {
  SUBSCRIBER = 'subscriber',
  GUARANTOR = 'guarantor',
  BOTH = 'both',
}

export enum CompanyStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
}

// A partner delivery company. While ACTIVE, every driver linked to it inherits
// trust Level 3 (any parcel value) and the company is collectively responsible.
@Entity('partner_companies')
export class PartnerCompany {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    name: 'company_type',
    type: 'enum',
    enum: CompanyType,
    default: CompanyType.BOTH,
  })
  companyType: CompanyType;

  @Column({
    type: 'enum',
    enum: CompanyStatus,
    default: CompanyStatus.PENDING,
  })
  status: CompanyStatus;

  // The user account that manages this company (granted the PARTNER role).
  @Column({ name: 'manager_user_id', type: 'uuid', nullable: true })
  managerUserId?: string;

  // Reference to the signed contract on file.
  @Column({ name: 'contract_ref', nullable: true })
  contractRef?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  address?: string;

  // When the commercial subscription lapses (null = no expiry tracked yet).
  @Column({
    name: 'subscription_expires_at',
    type: 'timestamptz',
    nullable: true,
  })
  subscriptionExpiresAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
