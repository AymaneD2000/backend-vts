import { PaymentMethod } from '../../rides/entities/ride.entity';
export declare class CreateBookingDto {
    vehicleId: string;
    startDate: string;
    endDate: string;
    pickupLat?: number;
    pickupLng?: number;
    pickupAddress?: string;
    note?: string;
    paymentMethod?: PaymentMethod;
}
