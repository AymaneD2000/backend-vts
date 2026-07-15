import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from '../../merchants/entities/product.entity';
import { Order } from './order.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'product_id', type: 'uuid', nullable: true })
  productId?: string;

  @ManyToOne(() => Product, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'product_id' })
  product?: Product;

  @Column({ name: 'product_name', length: 160 })
  productName: string;

  @Column({ name: 'unit_price', type: 'integer' })
  unitPrice: number;

  @Column({ type: 'integer' })
  quantity: number;

  @Column({ name: 'line_total', type: 'integer' })
  lineTotal: number;
}
