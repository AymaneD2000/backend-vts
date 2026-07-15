import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Order, OrderStatus } from './order.entity';

@Entity('order_status_history')
export class OrderStatusHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string;

  @ManyToOne(() => Order, (order) => order.history, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'from_status', type: 'varchar', length: 30, nullable: true })
  fromStatus?: OrderStatus;

  @Column({ name: 'to_status', type: 'varchar', length: 30 })
  toStatus: OrderStatus;

  @Column({ name: 'actor_user_id', type: 'uuid', nullable: true })
  actorUserId?: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'actor_user_id' })
  actor?: User;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
