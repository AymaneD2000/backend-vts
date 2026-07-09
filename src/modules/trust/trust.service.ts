import {
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrustLevel } from '../../common/trust-level';
import {
  DriverProfile,
  KycStatus,
} from '../users/entities/driver-profile.entity';
import { CreateGuarantorDto } from './dto/create-guarantor.dto';
import { UpdateGuarantorDto } from './dto/update-guarantor.dto';
import { CreatePartnerCompanyDto } from './dto/create-partner-company.dto';
import { UpdatePartnerCompanyDto } from './dto/update-partner-company.dto';
import { AssignTrustDto } from './dto/assign-trust.dto';
import { UpdateTrustConfigDto } from './dto/update-trust-config.dto';
import { Guarantor } from './entities/guarantor.entity';
import {
  CompanyStatus,
  PartnerCompany,
} from './entities/partner-company.entity';
import { TrustConfig } from './entities/trust-config.entity';

// Default caps seeded on first boot (admin-configurable thereafter).
const DEFAULT_CONFIGS: Array<{
  trustLevel: TrustLevel;
  label: string;
  maxDeclaredValue: number | null;
}> = [
  { trustLevel: TrustLevel.KYC_SIMPLE, label: 'KYC simple', maxDeclaredValue: 50000 },
  { trustLevel: TrustLevel.REFERENCED, label: 'Référencé individuel', maxDeclaredValue: 500000 },
  { trustLevel: TrustLevel.ENTERPRISE, label: 'Entreprise partenaire', maxDeclaredValue: null },
];

@Injectable()
export class TrustService implements OnModuleInit {
  constructor(
    @InjectRepository(Guarantor)
    private readonly guarantors: Repository<Guarantor>,
    @InjectRepository(PartnerCompany)
    private readonly companies: Repository<PartnerCompany>,
    @InjectRepository(TrustConfig)
    private readonly configs: Repository<TrustConfig>,
    @InjectRepository(DriverProfile)
    private readonly profiles: Repository<DriverProfile>,
  ) {}

  // Idempotently seed the value caps so a fresh database is usable immediately.
  async onModuleInit(): Promise<void> {
    for (const cfg of DEFAULT_CONFIGS) {
      const existing = await this.configs.findOne({
        where: { trustLevel: cfg.trustLevel },
      });
      if (!existing) {
        await this.configs.save(this.configs.create(cfg));
      }
    }
  }

  // --- Trust computation ---

  // The minimum trust level required to carry a parcel of the given value,
  // based on the admin-configured caps. Returns ENTERPRISE if the value
  // exceeds every finite cap.
  async getRequiredTrustLevel(declaredValue: number): Promise<TrustLevel> {
    const configs = await this.configs.find({ order: { trustLevel: 'ASC' } });
    for (const cfg of configs) {
      if (cfg.maxDeclaredValue === null) return cfg.trustLevel;
      if (declaredValue <= Number(cfg.maxDeclaredValue)) return cfg.trustLevel;
    }
    return TrustLevel.ENTERPRISE;
  }

  // Derive a driver's trust level from their current links and KYC status.
  private async computeTrustLevel(profile: DriverProfile): Promise<TrustLevel> {
    if (profile.partnerCompanyId) {
      const company = await this.companies.findOne({
        where: { id: profile.partnerCompanyId },
      });
      if (company && company.status === CompanyStatus.ACTIVE) {
        return TrustLevel.ENTERPRISE;
      }
    }
    if (profile.guarantorId) {
      const guarantor = await this.guarantors.findOne({
        where: { id: profile.guarantorId },
      });
      if (guarantor && guarantor.isVerified && guarantor.isActive) {
        return TrustLevel.REFERENCED;
      }
    }
    if (profile.kycStatus === KycStatus.APPROVED) {
      return TrustLevel.KYC_SIMPLE;
    }
    return TrustLevel.NONE;
  }

  // Recompute and persist a driver's materialized trust level.
  async refreshTrustLevel(userId: string): Promise<TrustLevel> {
    const profile = await this.profiles.findOne({ where: { userId } });
    if (!profile) return TrustLevel.NONE;
    const level = await this.computeTrustLevel(profile);
    if (profile.trustLevel !== level) {
      profile.trustLevel = level;
      await this.profiles.save(profile);
    }
    return level;
  }

  // Restrict a candidate set to drivers meeting a minimum trust level.
  async filterByTrustLevel(
    userIds: string[],
    minLevel: TrustLevel,
  ): Promise<string[]> {
    if (minLevel <= TrustLevel.NONE) return userIds;
    if (userIds.length === 0) return [];
    const rows = await this.profiles
      .createQueryBuilder('p')
      .select('p.user_id', 'userId')
      .where('p.user_id IN (:...userIds)', { userIds })
      .andWhere('p.trust_level >= :minLevel', { minLevel })
      .getRawMany<{ userId: string }>();
    return rows.map((r) => r.userId);
  }

  // Recompute every approved/linked driver's level (e.g. after a config or
  // guarantor change). Best-effort bulk refresh used by admin actions.
  private async refreshMany(userIds: string[]): Promise<void> {
    for (const userId of userIds) {
      await this.refreshTrustLevel(userId);
    }
  }

  // --- KYC integration ---

  // When a driver's KYC is approved they reach at least Level 1.
  @OnEvent('kyc.approved')
  async handleKycApproved(payload: { userId: string }): Promise<void> {
    await this.refreshTrustLevel(payload.userId);
  }

  // --- Guarantors (admin) ---

  createGuarantor(dto: CreateGuarantorDto): Promise<Guarantor> {
    return this.guarantors.save(this.guarantors.create(dto));
  }

  listGuarantors(): Promise<Guarantor[]> {
    return this.guarantors.find({ order: { createdAt: 'DESC' } });
  }

  async updateGuarantor(
    id: string,
    dto: UpdateGuarantorDto,
  ): Promise<Guarantor> {
    const guarantor = await this.guarantors.findOne({ where: { id } });
    if (!guarantor) throw new NotFoundException('Guarantor not found');
    Object.assign(guarantor, dto);
    const saved = await this.guarantors.save(guarantor);
    await this.refreshReferredDrivers(id);
    return saved;
  }

  async verifyGuarantor(id: string, verified: boolean): Promise<Guarantor> {
    const guarantor = await this.guarantors.findOne({ where: { id } });
    if (!guarantor) throw new NotFoundException('Guarantor not found');
    guarantor.isVerified = verified;
    const saved = await this.guarantors.save(guarantor);
    await this.refreshReferredDrivers(id);
    return saved;
  }

  private async refreshReferredDrivers(guarantorId: string): Promise<void> {
    const drivers = await this.profiles.find({ where: { guarantorId } });
    await this.refreshMany(drivers.map((d) => d.userId));
  }

  // --- Partner companies (admin) ---

  createCompany(dto: CreatePartnerCompanyDto): Promise<PartnerCompany> {
    return this.companies.save(this.companies.create(dto));
  }

  listCompanies(): Promise<PartnerCompany[]> {
    return this.companies.find({ order: { createdAt: 'DESC' } });
  }

  async updateCompany(
    id: string,
    dto: UpdatePartnerCompanyDto,
  ): Promise<PartnerCompany> {
    const company = await this.companies.findOne({ where: { id } });
    if (!company) throw new NotFoundException('Company not found');
    Object.assign(company, {
      ...dto,
      subscriptionExpiresAt: dto.subscriptionExpiresAt
        ? new Date(dto.subscriptionExpiresAt)
        : company.subscriptionExpiresAt,
    });
    const saved = await this.companies.save(company);
    await this.refreshCompanyDrivers(id);
    return saved;
  }

  private async refreshCompanyDrivers(companyId: string): Promise<void> {
    const drivers = await this.profiles.find({
      where: { partnerCompanyId: companyId },
    });
    await this.refreshMany(drivers.map((d) => d.userId));
  }

  // --- Assignment ---

  async assign(dto: AssignTrustDto): Promise<DriverProfile> {
    const profile = await this.profiles.findOne({
      where: { userId: dto.driverUserId },
    });
    if (!profile) throw new NotFoundException('Driver profile not found');
    if (dto.guarantorId !== undefined) {
      profile.guarantorId = dto.guarantorId ?? undefined;
    }
    if (dto.partnerCompanyId !== undefined) {
      profile.partnerCompanyId = dto.partnerCompanyId ?? undefined;
    }
    await this.profiles.save(profile);
    await this.refreshTrustLevel(dto.driverUserId);
    return this.profiles.findOne({
      where: { userId: dto.driverUserId },
    }) as Promise<DriverProfile>;
  }

  // --- Config (admin) ---

  listConfig(): Promise<TrustConfig[]> {
    return this.configs.find({ order: { trustLevel: 'ASC' } });
  }

  async updateConfig(dto: UpdateTrustConfigDto): Promise<TrustConfig> {
    const config = await this.configs.findOne({
      where: { trustLevel: dto.trustLevel },
    });
    if (!config) throw new NotFoundException('Trust config not found');
    config.maxDeclaredValue = dto.maxDeclaredValue;
    return this.configs.save(config);
  }
}
