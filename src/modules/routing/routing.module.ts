import { Module } from '@nestjs/common';
import { RoutingService } from './routing.service';
import { GeocodingController } from './geocoding.controller';
import { GeocodingService } from './geocoding.service';

@Module({
  controllers: [GeocodingController],
  providers: [RoutingService, GeocodingService],
  exports: [RoutingService, GeocodingService],
})
export class RoutingModule {}
