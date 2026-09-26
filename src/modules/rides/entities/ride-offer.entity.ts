import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum RideOfferStatus { OFFERED = 'offered', ACCEPTED = 'accepted', REFUSED = 'refused', EXPIRED = 'expired', WITHDRAWN = 'withdrawn' }

@Entity('ride_offers')
@Index(['rideId', 'driverId'], { unique: true })
@Index(['driverId', 'status', 'expiresAt'])
export class RideOffer {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'ride_id', type: 'uuid' }) rideId: string;
  @Column({ name: 'driver_id', type: 'uuid' }) driverId: string;
  @Column({ type: 'varchar', length: 20 }) status: RideOfferStatus;
  @CreateDateColumn({ name: 'offered_at', type: 'timestamptz' }) offeredAt: Date;
  @Column({ name: 'expires_at', type: 'timestamptz' }) expiresAt: Date;
  @Column({ name: 'responded_at', type: 'timestamptz', nullable: true }) respondedAt: Date | null;
}
