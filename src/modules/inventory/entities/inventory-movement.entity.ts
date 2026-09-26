import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum InventoryMovementType {
  ADJUSTMENT = 'adjustment',
  ORDER_RESERVATION = 'order_reservation',
  ORDER_RELEASE = 'order_release',
}

@Entity('inventory_movements')
@Index(['merchantId', 'productId', 'createdAt'])
export class InventoryMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'merchant_id', type: 'uuid' })
  merchantId: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @Column({ name: 'order_id', type: 'uuid', nullable: true })
  orderId?: string;

  @Column({ name: 'actor_user_id', type: 'uuid', nullable: true })
  actorUserId?: string;

  @Column({ type: 'varchar', length: 30 })
  type: InventoryMovementType;

  @Column({ name: 'quantity_delta', type: 'integer' })
  quantityDelta: number;

  @Column({ name: 'balance_after', type: 'integer' })
  balanceAfter: number;

  @Column({ type: 'text', nullable: true })
  reason?: string;

  @Index({ unique: true })
  @Column({ name: 'idempotency_key', type: 'varchar', length: 200 })
  idempotencyKey: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
