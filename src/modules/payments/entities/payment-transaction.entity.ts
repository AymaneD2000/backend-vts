import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Order } from '../../orders/entities/order.entity';
import { Ride } from '../../rides/entities/ride.entity';
import { PaymentEvent } from './payment-event.entity';

export enum PaymentDirection {
  COLLECTION = 'COLLECTION',
  REFUND = 'REFUND',
  PAYOUT = 'PAYOUT',
}

export enum PaymentStatus {
  PAY_ON_DELIVERY = 'PAY_ON_DELIVERY',
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUND_PENDING = 'REFUND_PENDING',
  REFUNDED = 'REFUNDED',
}

@Entity('payment_transactions')
export class PaymentTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  user: User;

  @Index()
  @Column({ name: 'order_id', type: 'uuid', nullable: true })
  orderId?: string;

  @ManyToOne(() => Order, { nullable: true })
  order?: Order;

  @Index()
  @Column({ name: 'ride_id', type: 'uuid', nullable: true })
  rideId?: string;

  @ManyToOne(() => Ride, { nullable: true })
  ride?: Ride;

  @Column({ name: 'withdrawal_id', type: 'uuid', nullable: true })
  withdrawalId?: string;

  @Column({ name: 'parent_transaction_id', type: 'uuid', nullable: true })
  parentTransactionId?: string;

  @ManyToOne(() => PaymentTransaction, { nullable: true })
  parentTransaction?: PaymentTransaction;

  @OneToMany(() => PaymentTransaction, (t) => t.parentTransaction)
  childTransactions: PaymentTransaction[];

  @OneToMany(() => PaymentEvent, (e) => e.transaction)
  events: PaymentEvent[];

  @Column({ type: 'enum', enum: PaymentDirection })
  direction: PaymentDirection;

  @Column({ name: 'provider', length: 50 })
  provider: string;

  @Column({ name: 'provider_reference', nullable: true, length: 100 })
  providerReference?: string;

  @Index({ unique: true })
  @Column({ name: 'idempotency_key', length: 100 })
  idempotencyKey: string;

  @Column({ type: 'integer' })
  amount: number;

  @Column({ length: 3, default: 'XOF' })
  currency: string;

  @Column({ name: 'destination_phone', nullable: true, length: 20 })
  destinationPhone?: string;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ name: 'failure_code', nullable: true, length: 50 })
  failureCode?: string;

  @Column({ name: 'initiated_at', type: 'timestamptz', nullable: true })
  initiatedAt?: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}