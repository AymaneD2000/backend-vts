import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { promises as fs } from 'fs';
import { basename, join, resolve } from 'path';
import { IsNull, Not, Repository } from 'typeorm';
import { ServiceType } from '../../common/service-type';
import { RequestRideDto } from '../rides/dto/request-ride.dto';
import { Ride } from '../rides/entities/ride.entity';
import { RidesService } from '../rides/rides.service';
import { User, UserRole } from '../users/entities/user.entity';
import { ApplyMerchantDto } from './dto/apply-merchant.dto';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
import { Merchant, MerchantStatus } from './entities/merchant.entity';

@Injectable()
export class MerchantsService {
  constructor(
    @InjectRepository(Merchant)
    private readonly merchants: Repository<Merchant>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly rides: RidesService,
    private readonly config: ConfigService,
  ) {}

  // --- Admin ---

  async create(dto: CreateMerchantDto): Promise<Merchant> {
    const merchant = await this.merchants.save(this.merchants.create(dto));
    if (
      merchant.ownerUserId &&
      merchant.status === MerchantStatus.ACTIVE
    ) {
      await this.grantMerchantRole(merchant.ownerUserId);
    }
    return merchant;
  }

  list(): Promise<Merchant[]> {
    return this.merchants.find({ order: { createdAt: 'DESC' } });
  }

  activeMerchants(): Promise<Merchant[]> {
    return this.merchants.find({
      where: {
        status: MerchantStatus.ACTIVE,
        lat: Not(IsNull()),
        lng: Not(IsNull()),
      },
      order: { name: 'ASC' },
      take: 250,
    });
  }

  async update(id: string, dto: UpdateMerchantDto): Promise<Merchant> {
    const merchant = await this.merchants.findOne({ where: { id } });
    if (!merchant) throw new NotFoundException('Merchant not found');
    Object.assign(merchant, dto);
    const saved = await this.merchants.save(merchant);
    if (saved.ownerUserId && saved.status === MerchantStatus.ACTIVE) {
      await this.grantMerchantRole(saved.ownerUserId);
    }
    return saved;
  }

  // --- Owner ---

  myMerchants(userId: string): Promise<Merchant[]> {
    return this.merchants.find({
      where: { ownerUserId: userId },
      order: { createdAt: 'DESC' },
    });
  }

  async apply(userId: string, dto: ApplyMerchantDto): Promise<Merchant> {
    const existing = await this.merchants.findOne({
      where: { ownerUserId: userId },
      order: { createdAt: 'DESC' },
    });
    if (existing) {
      throw new ConflictException(
        existing.status === MerchantStatus.PENDING
          ? 'A merchant application is already pending'
          : 'A merchant account already exists for this user',
      );
    }

    return this.merchants.save(
      this.merchants.create({
        ...dto,
        ownerUserId: userId,
        status: MerchantStatus.PENDING,
      }),
    );
  }

  async saveLogo(
    userId: string,
    merchantId: string,
    filename: string,
  ): Promise<Merchant> {
    const merchant = await this.merchants.findOne({
      where: { id: merchantId, ownerUserId: userId },
    });
    if (!merchant) {
      await this.removeLogoFile(filename);
      throw new NotFoundException('Merchant not found');
    }

    const previous = merchant.logoUrl;
    merchant.logoUrl = `/merchant-logos/${filename}`;
    try {
      const saved = await this.merchants.save(merchant);
      if (previous) await this.removeLogoFile(basename(previous));
      return saved;
    } catch (error) {
      await this.removeLogoFile(filename);
      throw error;
    }
  }

  async createDelivery(userId: string, dto: CreateDeliveryDto): Promise<Ride> {
    const merchant = await this.merchants.findOne({
      where: { id: dto.merchantId, ownerUserId: userId },
    });
    if (!merchant) throw new NotFoundException('Merchant not found');
    if (merchant.status !== MerchantStatus.ACTIVE) {
      throw new ForbiddenException('Merchant is not active');
    }
    if (merchant.lat == null || merchant.lng == null) {
      throw new BadRequestException('Merchant has no location set');
    }

    // A merchant delivery is just a ride: pickup at the shop, drop at the
    // customer. Reuses the entire dispatch/matching/realtime pipeline.
    const dropoffAddress = [dto.customerAddress, dto.customerName, dto.customerPhone]
      .filter(Boolean)
      .join(' · ');
    const rideDto: RequestRideDto = {
      serviceType: ServiceType.MERCHANT_DELIVERY,
      pickup: { lat: merchant.lat, lng: merchant.lng, address: merchant.address },
      dropoff: {
        lat: dto.customerLat,
        lng: dto.customerLng,
        address: dropoffAddress || undefined,
      },
      paymentMethod: dto.paymentMethod,
    };
    return this.rides.request(userId, rideDto, {
      merchantId: merchant.id,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      recipientName: dto.customerName,
      recipientPhone: dto.customerPhone,
      parcelDescription: dto.note,
    });
  }

  async myDeliveries(userId: string): Promise<Ride[]> {
    const mine = await this.myMerchants(userId);
    return this.rides.findByMerchantIds(mine.map((m) => m.id));
  }

  async dispatchDelivery(userId: string, rideId: string): Promise<Ride> {
    const delivery = await this.rides.findMerchantDelivery(rideId);
    const merchant = await this.merchants.findOne({
      where: { id: delivery.merchantId, ownerUserId: userId },
    });
    if (!merchant) throw new NotFoundException('Delivery not found');
    return this.rides.dispatchScheduled(rideId);
  }

  // Ensure the owning user carries the `merchant` role so they can reach the
  // merchant space. Idempotent.
  private async grantMerchantRole(userId: string): Promise<void> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) return;
    if (!user.roles.includes(UserRole.MERCHANT)) {
      user.roles = [...user.roles, UserRole.MERCHANT];
      await this.users.save(user);
    }
  }

  private logoDir(): string {
    return resolve(
      this.config.get<string>('merchant.logoDir') ?? 'uploads/merchant-logos',
    );
  }

  private async removeLogoFile(filename: string): Promise<void> {
    try {
      await fs.unlink(join(this.logoDir(), filename));
    } catch {
      // Missing files are harmless when replacing or rolling back an upload.
    }
  }
}
