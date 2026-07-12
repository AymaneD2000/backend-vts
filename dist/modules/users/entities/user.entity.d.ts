import { DriverProfile } from './driver-profile.entity';
export declare enum UserRole {
    CLIENT = "client",
    DRIVER = "driver",
    ADMIN = "admin",
    GUARANTOR = "guarantor",
    PARTNER = "partner",
    MERCHANT = "merchant"
}
export declare class User {
    id: string;
    phone?: string;
    email?: string;
    fullName?: string;
    roles: UserRole[];
    phoneVerified: boolean;
    emailVerified: boolean;
    passwordHash?: string;
    refreshTokenHash?: string;
    driverProfile?: DriverProfile;
    createdAt: Date;
    updatedAt: Date;
}
