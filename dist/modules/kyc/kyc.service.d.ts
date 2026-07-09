import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository } from 'typeorm';
import { DriverProfile, KycStatus } from '../users/entities/driver-profile.entity';
import { UsersService } from '../users/users.service';
import { UpdateDriverProfileDto } from './dto/update-driver-profile.dto';
import { KycDocument, KycDocumentType } from './entities/kyc-document.entity';
export interface UploadedFile {
    filename: string;
    originalname: string;
    mimetype: string;
}
export declare class KycService {
    private readonly docs;
    private readonly profiles;
    private readonly config;
    private readonly events;
    private readonly users;
    constructor(docs: Repository<KycDocument>, profiles: Repository<DriverProfile>, config: ConfigService, events: EventEmitter2, users: UsersService);
    private uploadDir;
    private getOrCreateProfile;
    getStatus(userId: string): Promise<{
        status: KycStatus;
        rejectionReason: string | null;
        profile: {
            vehicleType: import("../users/entities/driver-profile.entity").VehicleType | null;
            vehiclePlate: string | null;
            vehicleMake: string | null;
            vehicleModel: string | null;
            vehicleColor: string | null;
            vehicleYear: number | null;
        };
        requiredDocuments: KycDocumentType[];
        profileComplete: boolean;
        documentsComplete: boolean;
        canSubmit: boolean;
        documents: {
            id: string;
            type: KycDocumentType;
            originalName: string;
            createdAt: Date;
        }[];
    }>;
    updateProfile(userId: string, dto: UpdateDriverProfileDto): Promise<{
        status: KycStatus;
        rejectionReason: string | null;
        profile: {
            vehicleType: import("../users/entities/driver-profile.entity").VehicleType | null;
            vehiclePlate: string | null;
            vehicleMake: string | null;
            vehicleModel: string | null;
            vehicleColor: string | null;
            vehicleYear: number | null;
        };
        requiredDocuments: KycDocumentType[];
        profileComplete: boolean;
        documentsComplete: boolean;
        canSubmit: boolean;
        documents: {
            id: string;
            type: KycDocumentType;
            originalName: string;
            createdAt: Date;
        }[];
    }>;
    saveDocument(userId: string, type: KycDocumentType, file: UploadedFile): Promise<KycDocument>;
    submit(userId: string): Promise<DriverProfile>;
    listDocumentsFor(userId: string): Promise<{
        id: string;
        type: KycDocumentType;
        originalName: string;
        mimeType: string;
        createdAt: Date;
    }[]>;
    listPending(): Promise<{
        userId: string;
        phone: string;
        fullName: string | null;
        vehicleType: import("../users/entities/driver-profile.entity").VehicleType | null;
        vehiclePlate: string | null;
        vehicleMake: string | null;
        vehicleModel: string | null;
        vehicleColor: string | null;
        vehicleYear: number | null;
        submittedAt: Date;
    }[]>;
    review(userId: string, approve: boolean, reason?: string): Promise<DriverProfile>;
    getDocumentFile(documentId: string, requesterId: string, isAdmin: boolean): Promise<{
        path: string;
        mimeType: string;
        originalName: string;
    }>;
    private statusPayload;
    private profileComplete;
    private documentsComplete;
    private assertComplete;
    private missingProfileFields;
    private isFilled;
    private reopenRejected;
    private removeFile;
}
