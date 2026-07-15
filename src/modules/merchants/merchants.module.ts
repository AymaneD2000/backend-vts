import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { diskStorage } from 'multer';
import { resolve } from 'path';
import { RidesModule } from '../rides/rides.module';
import { User } from '../users/entities/user.entity';
import { Merchant } from './entities/merchant.entity';
import { ProductCategory } from './entities/product-category.entity';
import { Product } from './entities/product.entity';
import { Promotion } from './entities/promotion.entity';
import { MerchantsController } from './merchants.controller';
import { MerchantsService } from './merchants.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Merchant,
      ProductCategory,
      Product,
      Promotion,
      User,
    ]),
    RidesModule,
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const uploadDir = resolve(
          config.get<string>('merchant.logoDir') ?? 'uploads/merchant-logos',
        );
        mkdirSync(uploadDir, { recursive: true });
        return {
          limits: { fileSize: 5 * 1024 * 1024 },
          fileFilter: (_req, file, callback) => {
            callback(
              null,
              ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype),
            );
          },
          storage: diskStorage({
            destination: uploadDir,
            filename: (_req, file, callback) => {
              const extensions: Record<string, string> = {
                'image/jpeg': '.jpg',
                'image/png': '.png',
                'image/webp': '.webp',
              };
              callback(
                null,
                `${randomUUID()}${extensions[file.mimetype] ?? ''}`,
              );
            },
          }),
        };
      },
    }),
  ],
  controllers: [MerchantsController],
  providers: [MerchantsService],
  exports: [MerchantsService],
})
export class MerchantsModule {}
