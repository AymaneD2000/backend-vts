import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ride } from '../rides/entities/ride.entity';
import { RentalBooking } from '../rentals/entities/rental-booking.entity';
import { DriverProfile } from '../users/entities/driver-profile.entity';
import { Rating } from './entities/rating.entity';
import { RentalRating } from './entities/rental-rating.entity';
import { RatingsController } from './ratings.controller';
import { RentalRatingsController } from './rental-ratings.controller';
import { RatingsService } from './ratings.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Rating,
      RentalRating,
      Ride,
      RentalBooking,
      DriverProfile,
    ]),
  ],
  controllers: [RatingsController, RentalRatingsController],
  providers: [RatingsService],
  exports: [RatingsService],
})
export class RatingsModule {}
