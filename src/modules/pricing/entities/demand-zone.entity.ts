import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ServiceType } from '../../../common/service-type';
import { RideTier } from '../../rides/entities/ride.entity';

@Entity('demand_zones')
export class DemandZone {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() name: string;
  @Column({ name: 'center_lat', type: 'double precision' }) centerLat: number;
  @Column({ name: 'center_lng', type: 'double precision' }) centerLng: number;
  @Column({ name: 'radius_m', type: 'integer' }) radiusM: number;
  @Column({ name: 'service_type', type: 'varchar', nullable: true }) serviceType: ServiceType | null;
  @Column({ name: 'ride_tier', type: 'varchar', nullable: true }) rideTier: RideTier | null;
  @Column({ type: 'numeric', precision: 4, scale: 2 }) multiplier: number;
  @Column({ name: 'starts_at', type: 'timestamptz' }) startsAt: Date;
  @Column({ name: 'ends_at', type: 'timestamptz', nullable: true }) endsAt: Date | null;
  @Column({ default: true }) enabled: boolean;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
