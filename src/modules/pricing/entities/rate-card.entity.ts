import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ServiceType } from '../../../common/service-type';
import { RideTier } from '../../rides/entities/ride.entity';

@Entity('rate_cards')
@Index(['serviceType', 'rideTier', 'effectiveFrom'])
export class RateCard {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'service_type', type: 'varchar', length: 40 }) serviceType: ServiceType;
  @Column({ name: 'ride_tier', type: 'varchar', length: 20, nullable: true }) rideTier: RideTier | null;
  @Column({ name: 'base_amount', type: 'integer' }) baseAmount: number;
  @Column({ name: 'per_km_amount', type: 'integer' }) perKmAmount: number;
  @Column({ name: 'per_minute_amount', type: 'integer' }) perMinuteAmount: number;
  @Column({ name: 'minimum_amount', type: 'integer' }) minimumAmount: number;
  @Column({ name: 'average_speed_kmh', type: 'numeric' }) averageSpeedKmh: number;
  @Column({ name: 'effective_from', type: 'timestamptz' }) effectiveFrom: Date;
  @Column({ name: 'effective_until', type: 'timestamptz', nullable: true }) effectiveUntil: Date | null;
  @Column({ default: true }) enabled: boolean;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
