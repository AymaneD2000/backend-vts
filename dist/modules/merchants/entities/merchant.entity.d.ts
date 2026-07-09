export declare enum MerchantType {
    STORE = "store",
    RESTAURANT = "restaurant"
}
export declare enum MerchantStatus {
    PENDING = "pending",
    ACTIVE = "active",
    SUSPENDED = "suspended"
}
export declare class Merchant {
    id: string;
    name: string;
    type: MerchantType;
    ownerUserId?: string;
    phone?: string;
    address?: string;
    lat?: number;
    lng?: number;
    status: MerchantStatus;
    createdAt: Date;
    updatedAt: Date;
}
