"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KycService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const event_emitter_1 = require("@nestjs/event-emitter");
const typeorm_1 = require("@nestjs/typeorm");
const fs_1 = require("fs");
const path_1 = require("path");
const typeorm_2 = require("typeorm");
const driver_profile_entity_1 = require("../users/entities/driver-profile.entity");
const user_entity_1 = require("../users/entities/user.entity");
const users_service_1 = require("../users/users.service");
const kyc_document_entity_1 = require("./entities/kyc-document.entity");
const REQUIRED_DOCS = [
    kyc_document_entity_1.KycDocumentType.ID_CARD,
    kyc_document_entity_1.KycDocumentType.DRIVER_LICENSE,
    kyc_document_entity_1.KycDocumentType.VEHICLE_REGISTRATION,
    kyc_document_entity_1.KycDocumentType.PROFILE_PHOTO,
    kyc_document_entity_1.KycDocumentType.VEHICLE_PHOTO,
];
let KycService = class KycService {
    constructor(docs, profiles, config, events, users) {
        this.docs = docs;
        this.profiles = profiles;
        this.config = config;
        this.events = events;
        this.users = users;
    }
    uploadDir() {
        return (0, path_1.resolve)(this.config.get('kyc.uploadDir') ?? 'uploads/kyc');
    }
    async getOrCreateProfile(userId) {
        let profile = await this.profiles.findOne({ where: { userId } });
        if (!profile) {
            profile = await this.profiles.save(this.profiles.create({ userId }));
        }
        return profile;
    }
    async getStatus(userId) {
        const profile = await this.getOrCreateProfile(userId);
        const documents = await this.docs.find({
            where: { userId },
            order: { type: 'ASC' },
        });
        return this.statusPayload(profile, documents);
    }
    async updateProfile(userId, dto) {
        const profile = await this.getOrCreateProfile(userId);
        profile.vehicleType = dto.vehicleType;
        profile.vehiclePlate = dto.vehiclePlate.trim();
        profile.vehicleMake = dto.vehicleMake.trim();
        profile.vehicleModel = dto.vehicleModel.trim();
        profile.vehicleColor = dto.vehicleColor.trim();
        profile.vehicleYear = dto.vehicleYear;
        this.reopenRejected(profile);
        await this.profiles.save(profile);
        return this.getStatus(userId);
    }
    async saveDocument(userId, type, file) {
        const profile = await this.getOrCreateProfile(userId);
        if (this.reopenRejected(profile)) {
            await this.profiles.save(profile);
        }
        const existing = await this.docs.findOne({ where: { userId, type } });
        if (existing) {
            await this.removeFile(existing.filePath);
            existing.filePath = file.filename;
            existing.originalName = file.originalname;
            existing.mimeType = file.mimetype;
            return this.docs.save(existing);
        }
        return this.docs.save(this.docs.create({
            userId,
            type,
            filePath: file.filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
        }));
    }
    async submit(userId) {
        const profile = await this.getOrCreateProfile(userId);
        if (profile.kycStatus === driver_profile_entity_1.KycStatus.APPROVED) {
            throw new common_1.BadRequestException('KYC already approved');
        }
        const present = await this.docs.find({ where: { userId } });
        this.assertComplete(profile, present);
        profile.kycStatus = driver_profile_entity_1.KycStatus.SUBMITTED;
        profile.kycRejectionReason = undefined;
        return this.profiles.save(profile);
    }
    async listDocumentsFor(userId) {
        const documents = await this.docs.find({
            where: { userId },
            order: { type: 'ASC' },
        });
        return documents.map((d) => ({
            id: d.id,
            type: d.type,
            originalName: d.originalName,
            mimeType: d.mimeType,
            createdAt: d.createdAt,
        }));
    }
    async listPending() {
        const profiles = await this.profiles.find({
            where: { kycStatus: driver_profile_entity_1.KycStatus.SUBMITTED },
            relations: { user: true },
            order: { updatedAt: 'ASC' },
        });
        return profiles.map((p) => ({
            userId: p.userId,
            phone: p.user?.phone,
            fullName: p.user?.fullName ?? null,
            vehicleType: p.vehicleType ?? null,
            vehiclePlate: p.vehiclePlate ?? null,
            vehicleMake: p.vehicleMake ?? null,
            vehicleModel: p.vehicleModel ?? null,
            vehicleColor: p.vehicleColor ?? null,
            vehicleYear: p.vehicleYear ?? null,
            submittedAt: p.updatedAt,
        }));
    }
    async review(userId, approve, reason) {
        const profile = await this.profiles.findOne({ where: { userId } });
        if (!profile)
            throw new common_1.NotFoundException('Driver profile not found');
        if (profile.kycStatus !== driver_profile_entity_1.KycStatus.SUBMITTED) {
            throw new common_1.BadRequestException('No pending submission for this driver');
        }
        if (approve) {
            const documents = await this.docs.find({ where: { userId } });
            this.assertComplete(profile, documents);
            profile.kycStatus = driver_profile_entity_1.KycStatus.APPROVED;
            profile.kycRejectionReason = undefined;
        }
        else {
            profile.kycStatus = driver_profile_entity_1.KycStatus.REJECTED;
            profile.kycRejectionReason = reason;
        }
        const saved = await this.profiles.save(profile);
        if (approve) {
            const user = await this.users.findById(userId);
            if (user)
                await this.users.addRole(user, user_entity_1.UserRole.DRIVER);
            this.events.emit('kyc.approved', { userId });
        }
        return saved;
    }
    async getDocumentFile(documentId, requesterId, isAdmin) {
        const doc = await this.docs.findOne({ where: { id: documentId } });
        if (!doc)
            throw new common_1.NotFoundException('Document not found');
        if (!isAdmin && doc.userId !== requesterId) {
            throw new common_1.ForbiddenException('Not your document');
        }
        return {
            path: (0, path_1.join)(this.uploadDir(), doc.filePath),
            mimeType: doc.mimeType,
            originalName: doc.originalName,
        };
    }
    statusPayload(profile, documents) {
        const profileComplete = this.profileComplete(profile);
        const documentsComplete = this.documentsComplete(documents);
        const canSubmit = profile.kycStatus !== driver_profile_entity_1.KycStatus.SUBMITTED &&
            profile.kycStatus !== driver_profile_entity_1.KycStatus.APPROVED &&
            profileComplete &&
            documentsComplete;
        return {
            status: profile.kycStatus,
            rejectionReason: profile.kycRejectionReason ?? null,
            profile: {
                vehicleType: profile.vehicleType ?? null,
                vehiclePlate: profile.vehiclePlate ?? null,
                vehicleMake: profile.vehicleMake ?? null,
                vehicleModel: profile.vehicleModel ?? null,
                vehicleColor: profile.vehicleColor ?? null,
                vehicleYear: profile.vehicleYear ?? null,
            },
            requiredDocuments: REQUIRED_DOCS,
            profileComplete,
            documentsComplete,
            canSubmit,
            documents: documents.map((d) => ({
                id: d.id,
                type: d.type,
                originalName: d.originalName,
                createdAt: d.createdAt,
            })),
        };
    }
    profileComplete(profile) {
        return this.missingProfileFields(profile).length === 0;
    }
    documentsComplete(documents) {
        const types = new Set(documents.map((d) => d.type));
        return REQUIRED_DOCS.every((type) => types.has(type));
    }
    assertComplete(profile, documents) {
        const missingProfile = this.missingProfileFields(profile);
        if (missingProfile.length > 0) {
            throw new common_1.BadRequestException(`Missing profile information: ${missingProfile.join(', ')}`);
        }
        const types = new Set(documents.map((d) => d.type));
        const missingDocs = REQUIRED_DOCS.filter((type) => !types.has(type));
        if (missingDocs.length > 0) {
            throw new common_1.BadRequestException(`Missing documents: ${missingDocs.join(', ')}`);
        }
    }
    missingProfileFields(profile) {
        const missing = [];
        if (!profile.vehicleType)
            missing.push('vehicleType');
        if (!this.isFilled(profile.vehiclePlate))
            missing.push('vehiclePlate');
        if (!this.isFilled(profile.vehicleMake))
            missing.push('vehicleMake');
        if (!this.isFilled(profile.vehicleModel))
            missing.push('vehicleModel');
        if (!this.isFilled(profile.vehicleColor))
            missing.push('vehicleColor');
        return missing;
    }
    isFilled(value) {
        return Boolean(value?.trim());
    }
    reopenRejected(profile) {
        if (profile.kycStatus !== driver_profile_entity_1.KycStatus.REJECTED)
            return false;
        profile.kycStatus = driver_profile_entity_1.KycStatus.PENDING;
        profile.kycRejectionReason = undefined;
        return true;
    }
    async removeFile(filename) {
        try {
            await fs_1.promises.unlink((0, path_1.join)(this.uploadDir(), filename));
        }
        catch {
        }
    }
};
exports.KycService = KycService;
exports.KycService = KycService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(kyc_document_entity_1.KycDocument)),
    __param(1, (0, typeorm_1.InjectRepository)(driver_profile_entity_1.DriverProfile)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        config_1.ConfigService,
        event_emitter_1.EventEmitter2,
        users_service_1.UsersService])
], KycService);
//# sourceMappingURL=kyc.service.js.map