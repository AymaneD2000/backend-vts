import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RentalBooking } from '../../rentals/entities/rental-booking.entity';

// One rating per (booking, rater): client and driver each rate the other once
// per rental. Kept separate from the ride Rating so each table has a clean
// unique constraint; the driver average aggregates both sources.
@Entity('rental_ratings')
@Index(['rentalBookingId', 'raterId'], { unique: true })
export class RentalRating {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RentalBooking, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rental_booking_id' })
  booking: RentalBooking;

  @Index()
  @Column({ name: 'rental_booking_id' })
  rentalBookingId: string;

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
