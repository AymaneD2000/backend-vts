import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { promises as fs } from 'fs';
import { join, resolve } from 'path';
import { Repository } from 'typeorm';
import {
  DriverProfile,
  KycStatus,
} from '../users/entities/driver-profile.entity';
import { UserRole } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { UpdateDriverProfileDto } from './dto/update-driver-profile.dto';
import { KycDocument, KycDocumentType } from './entities/kyc-document.entity';

// Documents a driver must provide before submitting for review.
const REQUIRED_DOCS = [
  KycDocumentType.ID_CARD,
  KycDocumentType.DRIVER_LICENSE,
  KycDocumentType.VEHICLE_REGISTRATION,
  KycDocumentType.PROFILE_PHOTO,
  KycDocumentType.VEHICLE_PHOTO,
];

export interface UploadedFile {
  filename: string;
  originalname: string;
  mimetype: string;
}

@Injectable()
export class KycService {
  constructor(
    @InjectRepository(KycDocument)
    private readonly docs: Repository<KycDocument>,
    @InjectRepository(DriverProfile)
    private readonly profiles: Repository<DriverProfile>,
    private readonly config: ConfigService,
    private readonly events: EventEmitter2,
    private readonly users: UsersService,
  ) {}

  private uploadDir(): string {
    return resolve(this.config.get<string>('kyc.uploadDir') ?? 'uploads/kyc');
  }

  private async getOrCreateProfile(userId: string): Promise<DriverProfile> {
    let profile = await this.profiles.findOne({ where: { userId } });
    if (!profile) {
      profile = await this.profiles.save(this.profiles.create({ userId }));
    }
    return profile;
  }

  async getStatus(userId: string) {
    const profile = await this.getOrCreateProfile(userId);
    const documents = await this.docs.find({
      where: { userId },
      order: { type: 'ASC' },
    });
    return this.statusPayload(profile, documents);
  }

  async updateProfile(userId: string, dto: UpdateDriverProfileDto) {
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

  // Store an uploaded file, replacing any previous document of the same type.
  async saveDocument(
    userId: string,
    type: KycDocumentType,
    file: UploadedFile,
  ): Promise<KycDocument> {
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
    return this.docs.save(
      this.docs.create({
        userId,
        type,
        filePath: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
      }),
    );
  }

  // Driver declares their documents are complete and ready for review.
  async submit(userId: string): Promise<DriverProfile> {
    const profile = await this.getOrCreateProfile(userId);
    if (profile.kycStatus === KycStatus.APPROVED) {
      throw new BadRequestException('KYC already approved');
    }
    const present = await this.docs.find({ where: { userId } });
    this.assertComplete(profile, present);
    profile.kycStatus = KycStatus.SUBMITTED;
    profile.kycRejectionReason = undefined;
    return this.profiles.save(profile);
  }

  // --- Admin ---

  // The documents a given driver has uploaded (admin review preview).
  async listDocumentsFor(userId: string) {
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
      where: { kycStatus: KycStatus.SUBMITTED },
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

  async review(
    userId: string,
    approve: boolean,
    reason?: string,
  ): Promise<DriverProfile> {
    const profile = await this.profiles.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('Driver profile not found');
    if (profile.kycStatus !== KycStatus.SUBMITTED) {
      throw new BadRequestException('No pending submission for this driver');
    }
    if (approve) {
      const documents = await this.docs.find({ where: { userId } });
      this.assertComplete(profile, documents);
      profile.kycStatus = KycStatus.APPROVED;
      profile.kycRejectionReason = undefined;
    } else {
      profile.kycStatus = KycStatus.REJECTED;
      profile.kycRejectionReason = reason;
    }
    const saved = await this.profiles.save(profile);
    // Let the trust system grant at least Level 1 on approval.
    if (approve) {
      const user = await this.users.findById(userId);
      if (user) await this.users.addRole(user, UserRole.DRIVER);
      this.events.emit('kyc.approved', { userId });
    }
    return saved;
  }

  // Resolve a document for download, enforcing owner-or-admin access.
  async getDocumentFile(
    documentId: string,
    requesterId: string,
    isAdmin: boolean,
  ): Promise<{ path: string; mimeType: string; originalName: string }> {
    const doc = await this.docs.findOne({ where: { id: documentId } });
    if (!doc) throw new NotFoundException('Document not found');
    if (!isAdmin && doc.userId !== requesterId) {
      throw new ForbiddenException('Not your document');
    }
    return {
      path: join(this.uploadDir(), doc.filePath),
      mimeType: doc.mimeType,
      originalName: doc.originalName,
    };
  }

  private statusPayload(profile: DriverProfile, documents: KycDocument[]) {
    const profileComplete = this.profileComplete(profile);
    const documentsComplete = this.documentsComplete(documents);
    const canSubmit =
      profile.kycStatus !== KycStatus.SUBMITTED &&
      profile.kycStatus !== KycStatus.APPROVED &&
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

  private profileComplete(profile: DriverProfile): boolean {
    return this.missingProfileFields(profile).length === 0;
  }

  private documentsComplete(documents: KycDocument[]): boolean {
    const types = new Set(documents.map((d) => d.type));
    return REQUIRED_DOCS.every((type) => types.has(type));
  }

  private assertComplete(
    profile: DriverProfile,
    documents: KycDocument[],
  ): void {
    const missingProfile = this.missingProfileFields(profile);
    if (missingProfile.length > 0) {
      throw new BadRequestException(
        `Missing profile information: ${missingProfile.join(', ')}`,
      );
    }
    const types = new Set(documents.map((d) => d.type));
    const missingDocs = REQUIRED_DOCS.filter((type) => !types.has(type));
    if (missingDocs.length > 0) {
      throw new BadRequestException(
        `Missing documents: ${missingDocs.join(', ')}`,
      );
    }
  }

  private missingProfileFields(profile: DriverProfile): string[] {
    const missing: string[] = [];
    if (!profile.vehicleType) missing.push('vehicleType');
    if (!this.isFilled(profile.vehiclePlate)) missing.push('vehiclePlate');
    if (!this.isFilled(profile.vehicleMake)) missing.push('vehicleMake');
    if (!this.isFilled(profile.vehicleModel)) missing.push('vehicleModel');
    if (!this.isFilled(profile.vehicleColor)) missing.push('vehicleColor');
    return missing;
  }

  private isFilled(value?: string | null): boolean {
    return Boolean(value?.trim());
  }

  private reopenRejected(profile: DriverProfile): boolean {
    if (profile.kycStatus !== KycStatus.REJECTED) return false;
    profile.kycStatus = KycStatus.PENDING;
    profile.kycRejectionReason = undefined;
    return true;
  }

  private async removeFile(filename: string): Promise<void> {
    try {
      await fs.unlink(join(this.uploadDir(), filename));
    } catch {
      // best-effort cleanup; ignore if already gone
    }
  }
}
