import { VehicleType } from '../../users/entities/driver-profile.entity';
export declare class UpdateDriverProfileDto {
    vehicleType: VehicleType;
    vehiclePlate: string;
    vehicleMake: string;
    vehicleModel: string;
    vehicleColor: string;
    vehicleYear?: number;
}
