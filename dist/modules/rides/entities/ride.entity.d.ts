import { ServiceType } from '../../../common/service-type';
import { TrustLevel } from '../../../common/trust-level';
import { User } from '../../users/entities/user.entity';
export declare enum ParcelSize {
    SMALL = "small",
    MEDIUM = "medium",
    LARGE = "large"
}
export declare enum RideStatus {
    REQUESTED = "requested",
    ACCEPTED = "accepted",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    NO_DRIVER = "no_driver"
}
export declare enum PaymentMethod {
    CASH = "cash",
    MOBILE_MONEY = "mobile_money"
}
export declare enum CancelledBy {
    CLIENT = "client",
    DRIVER = "driver"
}
export declare enum CancelReason {
    CHANGED_MIND = "changed_mind",
    DRIVER_TOO_FAR = "driver_too_far",
    WAIT_TOO_LONG = "wait_too_long",
    WRONG_ADDRESS = "wrong_address",
    CLIENT_NO_SHOW = "client_no_show",
    CLIENT_UNREACHABLE = "client_unreachable",
    PRICE = "price",
    OTHER = "other"
}
export declare enum PaymentStatus {
    PENDING = "pending",
    PAID = "paid",
    FAILED = "failed"
}
export declare class Ride {
    id: string;
    serviceType: ServiceType;
    status: RideStatus;
    client: User;
    clientId: string;
    driver?: User;
    driverId?: string;
    pickupLat: number;
    pickupLng: number;
    pickupAddress?: string;
    dropoffLat: number;
    dropoffLng: number;
    dropoffAddress?: string;
    distanceM: number;
    durationS: number;
    fareAmount: number;
    currency: string;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    acceptedAt?: Date;
    startedAt?: Date;
    completedAt?: Date;
    scheduledAt?: Date;
    dispatchedAt?: Date;
    cancelledAt?: Date;
    cancelledBy?: CancelledBy;
    cancelReason?: CancelReason;
    cancelNote?: string;
    declaredValue?: number;
    parcelDescription?: string;
    recipientName?: string;
    recipientPhone?: string;
    parcelSize?: ParcelSize;
    requiredTrustLevel?: TrustLevel;
    merchantId?: string;
    createdAt: Date;
    updatedAt: Date;
}
