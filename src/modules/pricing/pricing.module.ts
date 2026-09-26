import { Module } from '@nestjs/common';
import { RoutingModule } from '../routing/routing.module';
import { PricingController } from './pricing.controller';
import { PricingService } from './pricing.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RateCard } from './entities/rate-card.entity';
import { DemandZone } from './entities/demand-zone.entity';

@Module({
  imports: [RoutingModule, TypeOrmModule.forFeature([RateCard, DemandZone])],
  controllers: [PricingController],
  providers: [PricingService],
  exports: [PricingService],
})
export class PricingModule {}
