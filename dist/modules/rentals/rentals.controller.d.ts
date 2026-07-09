import { CancelBookingDto } from './dto/cancel-booking.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CreateRentalVehicleDto } from './dto/create-rental-vehicle.dto';
import { UpdateRentalVehicleDto } from './dto/update-rental-vehicle.dto';
import { RentalsService } from './rentals.service';
export declare class RentalsController {
    private readonly rentals;
    constructor(rentals: RentalsService);
    createVehicle(dto: CreateRentalVehicleDto): Promise<import("./entities/rental-vehicle.entity").RentalVehicle>;
    listVehicles(): Promise<import("./entities/rental-vehicle.entity").RentalVehicle[]>;
    updateVehicle(id: string, dto: UpdateRentalVehicleDto): Promise<import("./entities/rental-vehicle.entity").RentalVehicle>;
    listAllBookings(): Promise<import("./entities/rental-booking.entity").RentalBooking[]>;
    catalog(): Promise<(import("./entities/rental-vehicle.entity").RentalVehicle & {
        availableUnits: number;
    })[]>;
    book(userId: string, dto: CreateBookingDto): Promise<import("./entities/rental-booking.entity").RentalBooking>;
    myBookings(userId: string): Promise<import("./entities/rental-booking.entity").RentalBooking[]>;
    get(userId: string, id: string): Promise<import("./entities/rental-booking.entity").RentalBooking>;
    cancel(userId: string, id: string, dto: CancelBookingDto): Promise<import("./entities/rental-booking.entity").RentalBooking>;
    pending(): Promise<import("./entities/rental-booking.entity").RentalBooking[]>;
    accept(userId: string, id: string): Promise<import("./entities/rental-booking.entity").RentalBooking>;
    start(userId: string, id: string): Promise<import("./entities/rental-booking.entity").RentalBooking>;
    complete(userId: string, id: string): Promise<import("./entities/rental-booking.entity").RentalBooking>;
}
