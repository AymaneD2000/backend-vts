import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RentalBooking } from './entities/rental-booking.entity';
import { RentalVehicle } from './entities/rental-vehicle.entity';
import { RentalsController } from './rentals.controller';
import { RentalsService } from './rentals.service';

@Module({
  imports: [TypeOrmModule.forFeature([RentalVehicle, RentalBooking])],
  controllers: [RentalsController],
  providers: [RentalsService],
  exports: [RentalsService],
})
export class RentalsModule {}
