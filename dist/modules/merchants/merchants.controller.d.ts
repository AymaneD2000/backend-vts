import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
import { MerchantsService } from './merchants.service';
export declare class MerchantsController {
    private readonly merchants;
    constructor(merchants: MerchantsService);
    create(dto: CreateMerchantDto): Promise<import("./entities/merchant.entity").Merchant>;
    list(): Promise<import("./entities/merchant.entity").Merchant[]>;
    update(id: string, dto: UpdateMerchantDto): Promise<import("./entities/merchant.entity").Merchant>;
    mine(userId: string): Promise<import("./entities/merchant.entity").Merchant[]>;
    createDelivery(userId: string, dto: CreateDeliveryDto): Promise<import("../rides/entities/ride.entity").Ride>;
    myDeliveries(userId: string): Promise<import("../rides/entities/ride.entity").Ride[]>;
    dispatchDelivery(userId: string, id: string): Promise<import("../rides/entities/ride.entity").Ride>;
}
