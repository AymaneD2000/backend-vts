export declare enum KycDocumentType {
    ID_CARD = "id_card",
    DRIVER_LICENSE = "driver_license",
    VEHICLE_REGISTRATION = "vehicle_registration",
    PROFILE_PHOTO = "profile_photo",
    VEHICLE_PHOTO = "vehicle_photo"
}
export declare class KycDocument {
    id: string;
    userId: string;
    type: KycDocumentType;
    filePath: string;
    originalName: string;
    mimeType: string;
    createdAt: Date;
}
