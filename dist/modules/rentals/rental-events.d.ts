import { RentalBooking } from './entities/rental-booking.entity';
export declare const RENTAL_UPDATED = "rental.updated";
export interface RentalUpdatedEvent {
    booking: RentalBooking;
}
