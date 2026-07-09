import { OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository } from 'typeorm';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { CreateRentalVehicleDto } from './dto/create-rental-vehicle.dto';
import { UpdateRentalVehicleDto } from './dto/update-rental-vehicle.dto';
import { RentalBooking } from './entities/rental-booking.entity';
import { RentalVehicle } from './entities/rental-vehicle.entity';
export declare class RentalsService implements OnModuleInit {
    private readonly vehicles;
    private readonly bookings;
    private readonly events;
    constructor(vehicles: Repository<RentalVehicle>, bookings: Repository<RentalBooking>, events: EventEmitter2);
    private emitUpdated;
    onModuleInit(): Promise<void>;
    createVehicle(dto: CreateRentalVehicleDto): Promise<RentalVehicle>;
    listVehicles(): Promise<RentalVehicle[]>;
    updateVehicle(id: string, dto: UpdateRentalVehicleDto): Promise<RentalVehicle>;
    listBookings(): Promise<RentalBooking[]>;
    listCatalog(): Promise<Array<RentalVehicle & {
        availableUnits: number;
    }>>;
    private activeCounts;
    private activeCountFor;
    book(clientId: string, dto: CreateBookingDto): Promise<RentalBooking>;
    myBookings(clientId: string): Promise<RentalBooking[]>;
    get(id: string, userId: string): Promise<RentalBooking>;
    cancel(id: string, userId: string, dto?: CancelBookingDto): Promise<RentalBooking>;
    listPending(): Promise<RentalBooking[]>;
    accept(id: string, driverId: string): Promise<RentalBooking>;
    start(id: string, driverId: string): Promise<RentalBooking>;
    complete(id: string, driverId: string): Promise<RentalBooking>;
    private computeDays;
    private assertDriver;
    private getOrThrow;
}
