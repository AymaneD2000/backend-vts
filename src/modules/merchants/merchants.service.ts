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
import {
  IsNull,
  LessThanOrEqual,
  MoreThanOrEqual,
  Not,
  Repository,
} from 'typeorm';
import { ServiceType } from '../../common/service-type';
import { RequestRideDto } from '../rides/dto/request-ride.dto';
import { Ride } from '../rides/entities/ride.entity';
import { RidesService } from '../rides/rides.service';
import { User, UserRole } from '../users/entities/user.entity';
import { ApplyMerchantDto } from './dto/apply-merchant.dto';
import {
  CreateProductCategoryDto,
  CreateProductDto,
  UpdateProductCategoryDto,
  UpdateProductDto,
  UpdateStorefrontDto,
} from './dto/catalog.dto';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
import { CreatePromotionDto, UpdatePromotionDto } from './dto/promotion.dto';
import { Merchant, MerchantStatus } from './entities/merchant.entity';
import { ProductCategory } from './entities/product-category.entity';
import { Product } from './entities/product.entity';
import { Promotion, PromotionType } from './entities/promotion.entity';

export interface MerchantCatalog {
  merchant: Merchant;
  categories: ProductCategory[];
  promotions: Promotion[];
}

@Injectable()
export class MerchantsService {
  constructor(
    @InjectRepository(Merchant)
    private readonly merchants: Repository<Merchant>,
    @InjectRepository(ProductCategory)
    private readonly categories: Repository<ProductCategory>,
    @InjectRepository(Product)
    private readonly products: Repository<Product>,
    @InjectRepository(Promotion)
    private readonly promotions: Repository<Promotion>,
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

  featuredPromotions(): Promise<Promotion[]> {
    const now = new Date();
    return this.promotions.find({
      where: {
        isActive: true,
        startsAt: LessThanOrEqual(now),
        endsAt: MoreThanOrEqual(now),
        merchant: { status: MerchantStatus.ACTIVE },
      },
      relations: { merchant: true },
      order: { createdAt: 'DESC' },
      take: 12,
    });
  }

  async catalog(merchantId: string): Promise<MerchantCatalog> {
    const merchant = await this.merchants.findOne({
      where: { id: merchantId, status: MerchantStatus.ACTIVE },
    });
    if (!merchant) throw new NotFoundException('Merchant not found');
    const categories = await this.categories.find({
      where: {
        merchantId,
        isActive: true,
        products: { isAvailable: true },
      },
      relations: { products: true },
      order: { sortOrder: 'ASC', name: 'ASC', products: { sortOrder: 'ASC', name: 'ASC' } },
    });
    const promotions = await this.activePromotions(merchantId);
    return { merchant, categories, promotions };
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

  async ownerCatalog(
    userId: string,
    merchantId: string,
  ): Promise<MerchantCatalog> {
    const merchant = await this.ownedMerchant(userId, merchantId);
    const categories = await this.categories.find({
      where: { merchantId },
      relations: { products: true },
      order: { sortOrder: 'ASC', name: 'ASC', products: { sortOrder: 'ASC', name: 'ASC' } },
    });
    const promotions = await this.promotions.find({
      where: { merchantId },
      order: { startsAt: 'DESC' },
    });
    return { merchant, categories, promotions };
  }

  async updateStorefront(
    userId: string,
    merchantId: string,
    dto: UpdateStorefrontDto,
  ): Promise<Merchant> {
    const merchant = await this.ownedMerchant(userId, merchantId);
    Object.assign(merchant, dto);
    return this.merchants.save(merchant);
  }

  async createCategory(
    userId: string,
    merchantId: string,
    dto: CreateProductCategoryDto,
  ): Promise<ProductCategory> {
    await this.ownedMerchant(userId, merchantId);
    return this.categories.save(this.categories.create({ ...dto, merchantId }));
  }

  async updateCategory(
    userId: string,
    merchantId: string,
    categoryId: string,
    dto: UpdateProductCategoryDto,
  ): Promise<ProductCategory> {
    await this.ownedMerchant(userId, merchantId);
    const category = await this.categories.findOne({
      where: { id: categoryId, merchantId },
    });
    if (!category) throw new NotFoundException('Category not found');
    Object.assign(category, dto);
    return this.categories.save(category);
  }

  async saveCategoryImage(
    userId: string,
    merchantId: string,
    categoryId: string,
    filename: string,
  ): Promise<ProductCategory> {
    await this.ownedMerchant(userId, merchantId);
    const category = await this.categories.findOne({
      where: { id: categoryId, merchantId },
    });
    if (!category) {
      await this.removeLogoFile(filename);
      throw new NotFoundException('Category not found');
    }
    const previous = category.imageUrl;
    category.imageUrl = `/merchant-logos/${filename}`;
    try {
      const saved = await this.categories.save(category);
      if (previous) await this.removeLogoFile(basename(previous));
      return saved;
    } catch (error) {
      await this.removeLogoFile(filename);
      throw error;
    }
  }

  async createProduct(
    userId: string,
    merchantId: string,
    dto: CreateProductDto,
  ): Promise<Product> {
    await this.ownedMerchant(userId, merchantId);
    await this.requireCategory(merchantId, dto.categoryId);
    return this.products.save(this.products.create({ ...dto, merchantId }));
  }

  async updateProduct(
    userId: string,
    merchantId: string,
    productId: string,
    dto: UpdateProductDto,
  ): Promise<Product> {
    await this.ownedMerchant(userId, merchantId);
    const product = await this.products.findOne({
      where: { id: productId, merchantId },
    });
    if (!product) throw new NotFoundException('Product not found');
    if (dto.categoryId) await this.requireCategory(merchantId, dto.categoryId);
    Object.assign(product, dto);
    return this.products.save(product);
  }

  async saveProductImage(
    userId: string,
    merchantId: string,
    productId: string,
    filename: string,
  ): Promise<Product> {
    await this.ownedMerchant(userId, merchantId);
    const product = await this.products.findOne({
      where: { id: productId, merchantId },
    });
    if (!product) {
      await this.removeLogoFile(filename);
      throw new NotFoundException('Product not found');
    }
    const previous = product.imageUrl;
    product.imageUrl = `/merchant-logos/${filename}`;
    try {
      const saved = await this.products.save(product);
      if (previous) await this.removeLogoFile(basename(previous));
      return saved;
    } catch (error) {
      await this.removeLogoFile(filename);
      throw error;
    }
  }

  async ownerPromotions(
    userId: string,
    merchantId: string,
  ): Promise<Promotion[]> {
    await this.ownedMerchant(userId, merchantId);
    return this.promotions.find({
      where: { merchantId },
      order: { startsAt: 'DESC' },
    });
  }

  async createPromotion(
    userId: string,
    merchantId: string,
    dto: CreatePromotionDto,
  ): Promise<Promotion> {
    await this.ownedMerchant(userId, merchantId);
    const dates = this.promotionDates(dto.startsAt, dto.endsAt);
    this.validatePromotionValue(dto.type, dto.value);
    return this.promotions.save(
      this.promotions.create({
        ...dto,
        ...dates,
        merchantId,
        minimumOrderAmount: dto.minimumOrderAmount ?? 0,
      }),
    );
  }

  async updatePromotion(
    userId: string,
    merchantId: string,
    promotionId: string,
    dto: UpdatePromotionDto,
  ): Promise<Promotion> {
    await this.ownedMerchant(userId, merchantId);
    const promotion = await this.promotions.findOne({
      where: { id: promotionId, merchantId },
    });
    if (!promotion) throw new NotFoundException('Promotion not found');
    const type = dto.type ?? promotion.type;
    const value = dto.value ?? promotion.value;
    this.validatePromotionValue(type, value);
    Object.assign(promotion, dto);
    if (dto.startsAt) promotion.startsAt = new Date(dto.startsAt);
    if (dto.endsAt) promotion.endsAt = new Date(dto.endsAt);
    if (promotion.endsAt <= promotion.startsAt) {
      throw new BadRequestException('Promotion end must be after its start');
    }
    return this.promotions.save(promotion);
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

  private async ownedMerchant(
    userId: string,
    merchantId: string,
  ): Promise<Merchant> {
    const merchant = await this.merchants.findOne({
      where: { id: merchantId, ownerUserId: userId },
    });
    if (!merchant) throw new NotFoundException('Merchant not found');
    return merchant;
  }

  private async requireCategory(
    merchantId: string,
    categoryId: string,
  ): Promise<ProductCategory> {
    const category = await this.categories.findOne({
      where: { id: categoryId, merchantId },
    });
    if (!category) throw new BadRequestException('Invalid product category');
    return category;
  }

  private activePromotions(merchantId: string): Promise<Promotion[]> {
    const now = new Date();
    return this.promotions.find({
      where: {
        merchantId,
        isActive: true,
        startsAt: LessThanOrEqual(now),
        endsAt: MoreThanOrEqual(now),
      },
      order: { createdAt: 'DESC' },
    });
  }

  private promotionDates(
    startsAtValue: string,
    endsAtValue: string,
  ): { startsAt: Date; endsAt: Date } {
    const startsAt = new Date(startsAtValue);
    const endsAt = new Date(endsAtValue);
    if (endsAt <= startsAt) {
      throw new BadRequestException('Promotion end must be after its start');
    }
    return { startsAt, endsAt };
  }

  private validatePromotionValue(type: PromotionType, value: number): void {
    if (type === PromotionType.PERCENTAGE && (value < 1 || value > 100)) {
      throw new BadRequestException('Percentage must be between 1 and 100');
    }
    if (type === PromotionType.FIXED_AMOUNT && value < 1) {
      throw new BadRequestException('Fixed discount must be greater than zero');
    }
  }

  private async removeLogoFile(filename: string): Promise<void> {
    try {
      await fs.unlink(join(this.logoDir(), filename));
    } catch {
      // Missing files are harmless when replacing or rolling back an upload.
    }
  }
}
