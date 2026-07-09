export declare enum RentalCategory {
    MOTO = "moto",
    CAR = "car",
    TRICYCLE = "tricycle"
}
export declare class RentalVehicle {
    id: string;
    name: string;
    category: RentalCategory;
    dailyPrice: number;
    description?: string;
    imageUrl?: string;
    quantity: number;
    isAvailable: boolean;
    createdAt: Date;
    updatedAt: Date;
}
