import { User } from '../../users/entities/user.entity';
import { CancelledBy, PaymentMethod, PaymentStatus } from '../../rides/entities/ride.entity';
import { RentalCategory, RentalVehicle } from './rental-vehicle.entity';
export declare enum RentalStatus {
    REQUESTED = "requested",
    ACCEPTED = "accepted",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    NO_DRIVER = "no_driver"
}
export declare class RentalBooking {
    id: string;
    vehicle?: RentalVehicle;
    vehicleId?: string;
    vehicleName: string;
    category: RentalCategory;
    dailyPrice: number;
    client: User;
    clientId: string;
    driver?: User;
    driverId?: string;
    status: RentalStatus;
    startDate: string;
    endDate: string;
    days: number;
    pickupLat?: number;
    pickupLng?: number;
    pickupAddress?: string;
    note?: string;
    totalAmount: number;
    currency: string;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    acceptedAt?: Date;
    startedAt?: Date;
    completedAt?: Date;
    cancelledAt?: Date;
    cancelledBy?: CancelledBy;
    cancelNote?: string;
    createdAt: Date;
    updatedAt: Date;
}
