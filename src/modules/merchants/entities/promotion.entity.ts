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
import { Merchant } from './merchant.entity';

export enum PromotionType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
  FREE_DELIVERY = 'free_delivery',
}

@Entity('promotions')
export class Promotion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'merchant_id', type: 'uuid' })
  merchantId: string;

  @ManyToOne(() => Merchant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @Column({ length: 160 })
  name: string;

  @Column({ type: 'varchar', length: 30 })
  type: PromotionType;

  @Column({ type: 'integer', default: 0 })
  value: number;

  @Column({ name: 'minimum_order_amount', type: 'integer', default: 0 })
  minimumOrderAmount: number;

  @Index()
  @Column({ name: 'starts_at', type: 'timestamptz' })
  startsAt: Date;

  @Index()
  @Column({ name: 'ends_at', type: 'timestamptz' })
  endsAt: Date;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
