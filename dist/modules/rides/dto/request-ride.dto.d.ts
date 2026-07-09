import { ServiceType } from '../../../common/service-type';
import { PaymentMethod, ParcelSize } from '../entities/ride.entity';
declare class PlaceDto {
    lat: number;
    lng: number;
    address?: string;
}
export declare class RequestRideDto {
    serviceType: ServiceType;
    pickup: PlaceDto;
    dropoff: PlaceDto;
    paymentMethod?: PaymentMethod;
    declaredValue?: number;
    parcelDescription?: string;
    recipientName?: string;
    recipientPhone?: string;
    parcelSize?: ParcelSize;
}
export {};
