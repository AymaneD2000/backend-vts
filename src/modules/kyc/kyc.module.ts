import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { diskStorage } from 'multer';
import { extname, resolve } from 'path';
import { DriverProfile } from '../users/entities/driver-profile.entity';
import { UsersModule } from '../users/users.module';
import { KycDocument } from './entities/kyc-document.entity';
import { KycController } from './kyc.controller';
import { KycService } from './kyc.service';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([KycDocument, DriverProfile]),
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const uploadDir = resolve(
          config.get<string>('kyc.uploadDir') ?? 'uploads/kyc',
        );
        mkdirSync(uploadDir, { recursive: true });
        return {
          storage: diskStorage({
            destination: uploadDir,
            filename: (_req, file, cb) => {
              cb(null, `${randomUUID()}${extname(file.originalname)}`);
            },
          }),
        };
      },
    }),
  ],
  controllers: [KycController],
  providers: [KycService],
  exports: [KycService],
})
export class KycModule {}
