import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RateDto } from './dto/rate.dto';
import { RatingsService } from './ratings.service';

@UseGuards(JwtAuthGuard)
@Controller('rides/:rideId/rating')
export class RatingsController {
  constructor(private readonly ratings: RatingsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  rate(
    @CurrentUser('userId') userId: string,
    @Param('rideId') rideId: string,
    @Body() dto: RateDto,
  ) {
    return this.ratings.rate(rideId, userId, dto.score, dto.comment);
  }

  // Returns the rating the current user left for this ride, or null.
  @Get()
  mine(
    @CurrentUser('userId') userId: string,
    @Param('rideId') rideId: string,
  ) {
    return this.ratings.mine(rideId, userId);
  }
}
