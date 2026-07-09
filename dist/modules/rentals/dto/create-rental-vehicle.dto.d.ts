import { RentalCategory } from '../entities/rental-vehicle.entity';
export declare class CreateRentalVehicleDto {
    name: string;
    category: RentalCategory;
    dailyPrice: number;
    quantity?: number;
    description?: string;
    imageUrl?: string;
    isAvailable?: boolean;
}
