import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoutingService } from '../routing/routing.service';
import { QuoteDto } from './dto/quote.dto';
import { PricingService } from './pricing.service';

@UseGuards(JwtAuthGuard)
@Controller('pricing')
export class PricingController {
  constructor(
    private readonly pricing: PricingService,
    private readonly routing: RoutingService,
  ) {}

  @Post('quote')
  @HttpCode(HttpStatus.OK)
  async quote(@Body() dto: QuoteDto) {
    const { distanceM, durationS } = await this.routing.route(
      dto.pickup,
      dto.dropoff,
    );
    return this.pricing.quote(dto.serviceType, distanceM, durationS);
  }
}
