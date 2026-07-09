import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Ride } from '../../rides/entities/ride.entity';
import { User } from '../../users/entities/user.entity';

// One rating per (ride, rater): each party rates the other once per trip.
// Client rates driver and driver rates client, both stored here.
@Entity('ratings')
@Index(['rideId', 'raterId'], { unique: true })
export class Rating {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Ride, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ride_id' })
  ride: Ride;

  @Index()
  @Column({ name: 'ride_id' })
  rideId: string;

  // Who gave the rating.
  @Index()
  @Column({ name: 'rater_id' })
  raterId: string;

  // Who is being rated.
  @Index()
  @Column({ name: 'ratee_id' })
  rateeId: string;

  @Column({ type: 'int' })
  score: number;

  @Column({ type: 'text', nullable: true })
  comment?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
