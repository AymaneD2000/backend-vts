import { Repository } from 'typeorm';
import { Ride } from '../rides/entities/ride.entity';
import { RidesService } from '../rides/rides.service';
import { User } from '../users/entities/user.entity';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
import { Merchant } from './entities/merchant.entity';
export declare class MerchantsService {
    private readonly merchants;
    private readonly users;
    private readonly rides;
    constructor(merchants: Repository<Merchant>, users: Repository<User>, rides: RidesService);
    create(dto: CreateMerchantDto): Promise<Merchant>;
    list(): Promise<Merchant[]>;
    update(id: string, dto: UpdateMerchantDto): Promise<Merchant>;
    myMerchants(userId: string): Promise<Merchant[]>;
    createDelivery(userId: string, dto: CreateDeliveryDto): Promise<Ride>;
    myDeliveries(userId: string): Promise<Ride[]>;
    dispatchDelivery(userId: string, rideId: string): Promise<Ride>;
    private grantMerchantRole;
}
