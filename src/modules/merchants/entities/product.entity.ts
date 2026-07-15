import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Merchant } from './merchant.entity';
import { ProductCategory } from './product-category.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'merchant_id', type: 'uuid' })
  merchantId: string;

  @ManyToOne(() => Merchant, { onDelete: 'CASCADE' })
  merchant: Merchant;

  @Index()
  @Column({ name: 'category_id', type: 'uuid' })
  categoryId: string;

  @ManyToOne(() => ProductCategory, (category) => category.products, {
    onDelete: 'CASCADE',
  })
  category: ProductCategory;

  @Column({ length: 160 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  // Monetary amounts are stored as whole XOF values to avoid float errors.
  @Column({ type: 'integer' })
  price: number;

  @Column({ name: 'image_url', nullable: true })
  imageUrl?: string;

  @Column({ name: 'is_available', default: true })
  isAvailable: boolean;

  @Column({ name: 'sort_order', type: 'integer', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
