import { MerchantStatus, MerchantType } from '../entities/merchant.entity';
export declare class CreateMerchantDto {
    name: string;
    type: MerchantType;
    ownerUserId?: string;
    phone?: string;
    address?: string;
    lat?: number;
    lng?: number;
    status?: MerchantStatus;
}
