import { PaymentMethod } from '../../rides/entities/ride.entity';
export declare class CreateDeliveryDto {
    merchantId: string;
    customerLat: number;
    customerLng: number;
    customerAddress?: string;
    customerName: string;
    customerPhone: string;
    note?: string;
    paymentMethod?: PaymentMethod;
    scheduledAt?: string;
}
