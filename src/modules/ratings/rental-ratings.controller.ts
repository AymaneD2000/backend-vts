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
@Controller('rentals/bookings/:bookingId/rating')
export class RentalRatingsController {
  constructor(private readonly ratings: RatingsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  rate(
    @CurrentUser('userId') userId: string,
    @Param('bookingId') bookingId: string,
    @Body() dto: RateDto,
  ) {
    return this.ratings.rateRental(bookingId, userId, dto.score, dto.comment);
  }

  // Returns the rating the current user left for this rental, or null.
  @Get()
  mine(
    @CurrentUser('userId') userId: string,
    @Param('bookingId') bookingId: string,
  ) {
    return this.ratings.myRentalRating(bookingId, userId);
  }
}
