import { TrustLevel } from '../../../common/trust-level';
import { User } from './user.entity';
export declare enum KycStatus {
    PENDING = "pending",
    SUBMITTED = "submitted",
    APPROVED = "approved",
    REJECTED = "rejected"
}
export declare enum VehicleType {
    CAR = "car",
    MOTO = "moto"
}
export declare class DriverProfile {
    id: string;
    user: User;
    userId: string;
    kycStatus: KycStatus;
    kycRejectionReason?: string;
    trustLevel: TrustLevel;
    guarantorId?: string;
    partnerCompanyId?: string;
    vehicleType?: VehicleType;
    vehiclePlate?: string;
    vehicleMake?: string;
    vehicleModel?: string;
    vehicleColor?: string;
    vehicleYear?: number;
    isAvailable: boolean;
    lastLat?: number;
    lastLng?: number;
    ratingAvg: number;
    createdAt: Date;
    updatedAt: Date;
}
