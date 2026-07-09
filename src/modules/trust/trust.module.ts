import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverProfile } from '../users/entities/driver-profile.entity';
import { Guarantor } from './entities/guarantor.entity';
import { PartnerCompany } from './entities/partner-company.entity';
import { TrustConfig } from './entities/trust-config.entity';
import { TrustController } from './trust.controller';
import { TrustService } from './trust.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Guarantor,
      PartnerCompany,
      TrustConfig,
      DriverProfile,
    ]),
  ],
  controllers: [TrustController],
  providers: [TrustService],
  exports: [TrustService],
})
export class TrustModule {}
