import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TrustLevel } from '../../../common/trust-level';

// Admin-configurable cap per trust level: the maximum declared parcel value a
// driver at this level may carry. A null cap means unlimited (top tier).
// Seeded idempotently by TrustService.onModuleInit.
@Entity('trust_configs')
export class TrustConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ name: 'trust_level', type: 'smallint' })
  trustLevel: TrustLevel;

  @Column()
  label: string;

  // Maximum declared value (in FCFA) allowed at this level; null = unlimited.
  @Column({
    name: 'max_declared_value',
    type: 'numeric',
    precision: 12,
    scale: 0,
    nullable: true,
  })
  maxDeclaredValue: number | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
