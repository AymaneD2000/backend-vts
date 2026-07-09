export declare enum CompanyType {
    SUBSCRIBER = "subscriber",
    GUARANTOR = "guarantor",
    BOTH = "both"
}
export declare enum CompanyStatus {
    PENDING = "pending",
    ACTIVE = "active",
    SUSPENDED = "suspended"
}
export declare class PartnerCompany {
    id: string;
    name: string;
    companyType: CompanyType;
    status: CompanyStatus;
    managerUserId?: string;
    contractRef?: string;
    phone?: string;
    address?: string;
    subscriptionExpiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
