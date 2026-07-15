import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Merchant } from '../../merchants/entities/merchant.entity';
import { Promotion } from '../../merchants/entities/promotion.entity';
import { Ride } from '../../rides/entities/ride.entity';
import { User } from '../../users/entities/user.entity';
import { OrderItem } from './order-item.entity';
import { OrderStatusHistory } from './order-status-history.entity';

export enum OrderStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  PREPARING = 'preparing',
  READY_FOR_PICKUP = 'ready_for_pickup',
  DRIVER_ASSIGNED = 'driver_assigned',
  PICKED_UP = 'picked_up',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'customer_id' })
  customer: User;

  @Index()
  @Column({ name: 'merchant_id', type: 'uuid' })
  merchantId: string;

  @ManyToOne(() => Merchant, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @Index()
  @Column({ name: 'ride_id', type: 'uuid', nullable: true })
  rideId?: string;

  @ManyToOne(() => Ride, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'ride_id' })
  ride?: Ride;

  @Index()
  @Column({ type: 'varchar', length: 30, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ type: 'integer' })
  subtotal: number;

  @Column({ name: 'delivery_fee', type: 'integer' })
  deliveryFee: number;

  @Column({ name: 'discount_amount', type: 'integer', default: 0 })
  discountAmount: number;

  @Column({ name: 'promotion_id', type: 'uuid', nullable: true })
  promotionId?: string;

  @ManyToOne(() => Promotion, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'promotion_id' })
  promotion?: Promotion;

  @Column({ name: 'promotion_name', nullable: true })
  promotionName?: string;

  @Column({ type: 'integer' })
  total: number;

  @Column({ name: 'payment_method', type: 'varchar', length: 30 })
  paymentMethod: string;

  @Column({ name: 'customer_name', length: 160 })
  customerName: string;

  @Column({ name: 'customer_phone', length: 30 })
  customerPhone: string;

  @Column({ name: 'delivery_address', length: 500 })
  deliveryAddress: string;

  @Column({ name: 'delivery_lat', type: 'double precision' })
  deliveryLat: number;

  @Column({ name: 'delivery_lng', type: 'double precision' })
  deliveryLng: number;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @Column({ name: 'scheduled_at', type: 'timestamptz', nullable: true })
  scheduledAt?: Date;

  @Column({ name: 'accepted_at', type: 'timestamptz', nullable: true })
  acceptedAt?: Date;

  @Column({ name: 'preparing_at', type: 'timestamptz', nullable: true })
  preparingAt?: Date;

  @Column({ name: 'ready_at', type: 'timestamptz', nullable: true })
  readyAt?: Date;

  @Column({ name: 'picked_up_at', type: 'timestamptz', nullable: true })
  pickedUpAt?: Date;

  @Column({ name: 'delivered_at', type: 'timestamptz', nullable: true })
  deliveredAt?: Date;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt?: Date;

  @OneToMany(() => OrderItem, (item) => item.order)
  items: OrderItem[];

  @OneToMany(() => OrderStatusHistory, (history) => history.order)
  history: OrderStatusHistory[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
