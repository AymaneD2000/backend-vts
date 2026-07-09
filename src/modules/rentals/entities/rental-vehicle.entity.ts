import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

// Vehicle classes available for rental (events, trips, etc.).
export enum RentalCategory {
  MOTO = 'moto',
  CAR = 'car',
  TRICYCLE = 'tricycle', // 3-wheel motor (moto à 3 roues)
}

// A rentable vehicle the admin publishes to the catalog. Clients browse these
// and their per-day price, then place a booking.
@Entity('rental_vehicles')
export class RentalVehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: RentalCategory })
  category: RentalCategory;

  // Price per rental day, in XOF (FCFA).
  @Column({ name: 'daily_price', type: 'numeric', precision: 12, scale: 0 })
  dailyPrice: number;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'image_url', nullable: true })
  imageUrl?: string;

  // Number of physical units the owner has for this listing. A unit is
  // considered taken while it has an active booking; once all units are booked
  // the vehicle shows as unavailable to other clients.
  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ name: 'is_available', default: true })
  isAvailable: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
