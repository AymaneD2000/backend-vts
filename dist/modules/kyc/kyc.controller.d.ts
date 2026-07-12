import { StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { AuthUser } from '../../common/current-user.decorator';
import { ReviewKycDto } from './dto/review-kyc.dto';
import { UpdateDriverProfileDto } from './dto/update-driver-profile.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { KycService, UploadedFile as KycFile } from './kyc.service';
export declare class KycController {
    private readonly kyc;
    constructor(kyc: KycService);
    status(userId: string): Promise<{
        status: import("../users/entities/driver-profile.entity").KycStatus;
        rejectionReason: string | null;
        profile: {
            vehicleType: import("../users/entities/driver-profile.entity").VehicleType | null;
            vehiclePlate: string | null;
            vehicleMake: string | null;
            vehicleModel: string | null;
            vehicleColor: string | null;
            vehicleYear: number | null;
        };
        requiredDocuments: import("./entities/kyc-document.entity").KycDocumentType[];
        profileComplete: boolean;
        documentsComplete: boolean;
        canSubmit: boolean;
        documents: {
            id: string;
            type: import("./entities/kyc-document.entity").KycDocumentType;
            originalName: string;
            createdAt: Date;
        }[];
    }>;
    updateProfile(userId: string, dto: UpdateDriverProfileDto): Promise<{
        status: import("../users/entities/driver-profile.entity").KycStatus;
        rejectionReason: string | null;
        profile: {
            vehicleType: import("../users/entities/driver-profile.entity").VehicleType | null;
            vehiclePlate: string | null;
            vehicleMake: string | null;
            vehicleModel: string | null;
            vehicleColor: string | null;
            vehicleYear: number | null;
        };
        requiredDocuments: import("./entities/kyc-document.entity").KycDocumentType[];
        profileComplete: boolean;
        documentsComplete: boolean;
        canSubmit: boolean;
        documents: {
            id: string;
            type: import("./entities/kyc-document.entity").KycDocumentType;
            originalName: string;
            createdAt: Date;
        }[];
    }>;
    upload(userId: string, dto: UploadDocumentDto, file: KycFile): Promise<{
        id: string;
        type: import("./entities/kyc-document.entity").KycDocumentType;
        originalName: string;
    }>;
    submit(userId: string): Promise<import("../users/entities/driver-profile.entity").DriverProfile>;
    listPending(): Promise<{
        userId: string;
        phone: string | undefined;
        fullName: string | null;
        vehicleType: import("../users/entities/driver-profile.entity").VehicleType | null;
        vehiclePlate: string | null;
        vehicleMake: string | null;
        vehicleModel: string | null;
        vehicleColor: string | null;
        vehicleYear: number | null;
        submittedAt: Date;
    }[]>;
    listUserDocuments(userId: string): Promise<{
        id: string;
        type: import("./entities/kyc-document.entity").KycDocumentType;
        originalName: string;
        mimeType: string;
        createdAt: Date;
    }[]>;
    review(userId: string, dto: ReviewKycDto): Promise<import("../users/entities/driver-profile.entity").DriverProfile>;
    file(user: AuthUser, id: string, res: Response): Promise<StreamableFile>;
}
