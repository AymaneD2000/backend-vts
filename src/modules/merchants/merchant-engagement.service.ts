import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ActionRateLimiterService } from '../../common/action-rate-limiter.service';
import { ApplicationError, ApplicationErrorCode } from '../../common/application-error';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { Merchant } from './entities/merchant.entity';
import { MerchantFavorite } from './entities/merchant-favorite.entity';
import { MerchantReview } from './entities/merchant-review.entity';
import { CreateMerchantReviewDto, MerchantReviewDto } from './dto/merchant-engagement.dto';

@Injectable()
export class MerchantEngagementService {
  constructor(
    @InjectRepository(Merchant) private readonly merchants: Repository<Merchant>,
    @InjectRepository(MerchantFavorite) private readonly favorites: Repository<MerchantFavorite>,
    @InjectRepository(MerchantReview) private readonly reviews: Repository<MerchantReview>,
    @InjectRepository(Order) private readonly orders: Repository<Order>,
    private readonly dataSource: DataSource,
    private readonly rateLimiter: ActionRateLimiterService,
    private readonly config: ConfigService,
  ) {}

  async favorite(userId: string, merchantId: string): Promise<{ isFavorite: true }> {
    const merchant = await this.merchants.findOne({ where: { id: merchantId } });
    if (!merchant) throw new ApplicationError(HttpStatus.NOT_FOUND, ApplicationErrorCode.RESOURCE_NOT_FOUND, 'Merchant introuvable.');
    const existing = await this.favorites.findOne({ where: { userId, merchantId } });
    if (!existing) await this.favorites.save(this.favorites.create({ userId, merchantId }));
    return { isFavorite: true };
  }

  async unfavorite(userId: string, merchantId: string): Promise<{ isFavorite: false }> {
    await this.favorites.delete({ userId, merchantId });
    return { isFavorite: false };
  }

  listFavorites(userId: string): Promise<MerchantFavorite[]> {
    return this.favorites.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async createReview(customerId: string, merchantId: string, dto: CreateMerchantReviewDto): Promise<MerchantReviewDto> {
    await this.rateLimiter.consume('merchant-review', `${customerId}:${merchantId}`, {
      limit: this.config.get<number>('rateLimits.merchantReview.limit') ?? this.config.get<number>('rateLimit.merchantReviewLimit') ?? 5,
      windowSeconds: this.config.get<number>('rateLimits.merchantReview.windowSeconds') ?? this.config.get<number>('rateLimit.merchantReviewWindowSeconds') ?? 3600,
    });
    try {
      const review = await this.dataSource.transaction(async (manager) => {
        const merchant = await manager.findOne(Merchant, { where: { id: merchantId }, lock: { mode: 'pessimistic_write' } });
        if (!merchant) throw new ApplicationError(HttpStatus.NOT_FOUND, ApplicationErrorCode.RESOURCE_NOT_FOUND, 'Merchant introuvable.');
        const order = await manager.findOne(Order, { where: { id: dto.orderId, customerId, merchantId, status: OrderStatus.DELIVERED } });
        if (!order) throw new ApplicationError(HttpStatus.NOT_FOUND, ApplicationErrorCode.RESOURCE_NOT_FOUND, 'Commande introuvable.');
        const created = manager.create(MerchantReview, { merchantId, orderId: dto.orderId, customerId, score: dto.score, comment: dto.comment });
        let saved: MerchantReview;
        try { saved = await manager.save(MerchantReview, created); } catch { throw new ApplicationError(HttpStatus.CONFLICT, ApplicationErrorCode.INVALID_STATE_TRANSITION, 'Cette commande a déjà été évaluée.'); }
        const all = await manager.find(MerchantReview, { where: { merchantId } });
        merchant.ratingCount = all.length;
        merchant.ratingAvg = all.length ? Number((all.reduce((sum, row) => sum + row.score, 0) / all.length).toFixed(2)) : 0;
        await manager.save(Merchant, merchant);
        return saved;
      });
      return this.toReviewDto(review);
    } catch (error) {
      if (error instanceof ApplicationError) throw error;
      throw error;
    }
  }

  async listReviews(merchantId: string, limit = 20, cursor?: string): Promise<{ items: MerchantReviewDto[]; nextCursor: string | null }> {
    const rows = await this.reviews.find({ where: { merchantId }, order: { createdAt: 'DESC', id: 'DESC' }, take: Math.min(limit + 1, 100) });
    const filtered = cursor ? rows.filter((row) => `${row.createdAt.toISOString()}|${row.id}` < cursor) : rows;
    const page = filtered.slice(0, Math.min(limit, 100));
    const last = page[page.length - 1];
    return { items: page.map((row) => this.toReviewDto(row)), nextCursor: filtered.length > page.length && last ? `${last.createdAt.toISOString()}|${last.id}` : null };
  }

  private toReviewDto(row: MerchantReview): MerchantReviewDto {
    return { id: row.id, merchantId: row.merchantId, orderId: row.orderId, customerId: row.customerId, score: row.score, comment: row.comment ?? null, createdAt: row.createdAt.toISOString() };
  }
}
