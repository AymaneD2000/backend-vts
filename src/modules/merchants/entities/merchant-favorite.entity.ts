import { CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('merchant_favorites')
@Index(['userId', 'merchantId'], { unique: true })
export class MerchantFavorite {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @PrimaryColumn({ name: 'merchant_id', type: 'uuid' })
  merchantId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
