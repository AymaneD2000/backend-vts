import { RentalBooking } from './entities/rental-booking.entity';

// Emitted whenever a rental booking changes state; listeners push a
// notification to the client so they're reached even when backgrounded.
export const RENTAL_UPDATED = 'rental.updated';

export interface RentalUpdatedEvent {
  booking: RentalBooking;
}
