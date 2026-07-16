import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GeocodingService } from './geocoding.service';

@UseGuards(JwtAuthGuard)
@Controller('geo')
export class GeocodingController {
  constructor(private readonly geocoding: GeocodingService) {}

  @Get('search')
  search(@Query('q') query: string) {
    return this.geocoding.search(query ?? '');
  }

  @Get('reverse')
  reverse(@Query('lat') lat: string, @Query('lng') lng: string) {
    return this.geocoding.reverse(Number(lat), Number(lng));
  }
}
