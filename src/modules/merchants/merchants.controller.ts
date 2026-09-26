import {
  Body,
  Controller,
  Delete,
  FileValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../../common/current-user.decorator';
import { Roles } from '../../common/roles.decorator';
import { RolesGuard } from '../../common/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '../users/entities/user.entity';
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
import { MerchantsService } from './merchants.service';
import { MerchantEngagementService } from './merchant-engagement.service';
import { CreateMerchantReviewDto } from './dto/merchant-engagement.dto';

interface MerchantLogoFile {
  filename: string;
  mimetype: string;
}

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

class MerchantImageValidator extends FileValidator<Record<string, never>> {
  isValid(file?: unknown): boolean {
    if (file == null || Array.isArray(file) || typeof file !== 'object') {
      return false;
    }
    const mimetype = (file as { mimetype?: unknown }).mimetype;
    return typeof mimetype === 'string' && ALLOWED_IMAGE_TYPES.has(mimetype);
  }

  buildErrorMessage(): string {
    return 'Only JPEG, PNG, WebP, HEIC, and HEIF images are allowed';
  }
}

@UseGuards(JwtAuthGuard)
@Controller('merchants')
export class MerchantsController {
  constructor(private readonly merchants: MerchantsService, private readonly engagement: MerchantEngagementService) {}

  // --- Admin ---

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateMerchantDto) {
    return this.merchants.create(dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  list() {
    return this.merchants.list();
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateMerchantDto) {
    return this.merchants.update(id, dto);
  }

  // --- Owner ---

  @Get('mine')
  mine(@CurrentUser('userId') userId: string) {
    return this.merchants.myMerchants(userId);
  }

  @Get('favorites')
  favorites(@CurrentUser('userId') userId: string) {
    return this.engagement.listFavorites(userId);
  }

  @Get(':id/favorite')
  favoriteState(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.engagement.listFavorites(userId).then((rows) => ({ isFavorite: rows.some((row) => row.merchantId === id) }));
  }

  @Post(':id/favorite')
  favorite(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.engagement.favorite(userId, id);
  }

  @Delete(':id/favorite')
  unfavorite(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.engagement.unfavorite(userId, id);
  }

  @Get(':id/reviews')
  reviews(@Param('id') id: string, @Query('cursor') cursor?: string, @Query('limit') limit?: string) {
    return this.engagement.listReviews(id, limit ? Number(limit) : 20, cursor);
  }

  @Post(':id/reviews')
  createReview(@CurrentUser('userId') userId: string, @Param('id') id: string, @Body() dto: CreateMerchantReviewDto) {
    return this.engagement.createReview(userId, id, dto);
  }

  // Every signed-in user can discover active shops and restaurants.
  @Get('active')
  active() {
    return this.merchants.activeMerchants();
  }

  @Get('featured')
  featured() {
    return this.merchants.featuredPromotions();
  }

  @Get(':id/catalog')
  catalog(@Param('id') id: string) {
    return this.merchants.catalog(id);
  }

  @Post('mine/apply')
  apply(
    @CurrentUser('userId') userId: string,
    @Body() dto: ApplyMerchantDto,
  ) {
    return this.merchants.apply(userId, dto);
  }

  @Post('mine/:id/logo')
  @UseInterceptors(FileInterceptor('file'))
  uploadLogo(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new MerchantImageValidator({}),
        ],
      }),
    )
    file: MerchantLogoFile,
  ) {
    return this.merchants.saveLogo(userId, id, file.filename);
  }

  @Get('mine/:id/catalog')
  myCatalog(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.merchants.ownerCatalog(userId, id);
  }

  @Patch('mine/:id/storefront')
  updateStorefront(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateStorefrontDto,
  ) {
    return this.merchants.updateStorefront(userId, id, dto);
  }

  @Post('mine/:id/categories')
  createCategory(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: CreateProductCategoryDto,
  ) {
    return this.merchants.createCategory(userId, id, dto);
  }

  @Patch('mine/:id/categories/:categoryId')
  updateCategory(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Param('categoryId') categoryId: string,
    @Body() dto: UpdateProductCategoryDto,
  ) {
    return this.merchants.updateCategory(userId, id, categoryId, dto);
  }

  @Post('mine/:id/categories/:categoryId/image')
  @UseInterceptors(FileInterceptor('file'))
  uploadCategoryImage(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Param('categoryId') categoryId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new MerchantImageValidator({}),
        ],
      }),
    )
    file: MerchantLogoFile,
  ) {
    return this.merchants.saveCategoryImage(
      userId,
      id,
      categoryId,
      file.filename,
    );
  }

  @Post('mine/:id/products')
  createProduct(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: CreateProductDto,
  ) {
    return this.merchants.createProduct(userId, id, dto);
  }

  @Patch('mine/:id/products/:productId')
  updateProduct(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Param('productId') productId: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.merchants.updateProduct(userId, id, productId, dto);
  }

  @Post('mine/:id/products/:productId/image')
  @UseInterceptors(FileInterceptor('file'))
  uploadProductImage(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Param('productId') productId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new MerchantImageValidator({}),
        ],
      }),
    )
    file: MerchantLogoFile,
  ) {
    return this.merchants.saveProductImage(
      userId,
      id,
      productId,
      file.filename,
    );
  }

  @Get('mine/:id/promotions')
  promotions(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.merchants.ownerPromotions(userId, id);
  }

  @Post('mine/:id/promotions')
  createPromotion(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: CreatePromotionDto,
  ) {
    return this.merchants.createPromotion(userId, id, dto);
  }

  @Patch('mine/:id/promotions/:promotionId')
  updatePromotion(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Param('promotionId') promotionId: string,
    @Body() dto: UpdatePromotionDto,
  ) {
    return this.merchants.updatePromotion(userId, id, promotionId, dto);
  }

  @Post('mine/deliveries')
  createDelivery(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateDeliveryDto,
  ) {
    return this.merchants.createDelivery(userId, dto);
  }

  @Get('mine/deliveries')
  myDeliveries(@CurrentUser('userId') userId: string) {
    return this.merchants.myDeliveries(userId);
  }

  @Post('mine/deliveries/:id/dispatch')
  dispatchDelivery(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.merchants.dispatchDelivery(userId, id);
  }
}
