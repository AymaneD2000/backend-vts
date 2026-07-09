import { RentalBooking } from '../../rentals/entities/rental-booking.entity';
export declare class RentalRating {
    id: string;
    booking: RentalBooking;
    rentalBookingId: string;
    raterId: string;
    rateeId: string;
    score: number;
    comment?: string;
    createdAt: Date;
}
