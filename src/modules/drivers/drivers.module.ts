import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rating } from '../ratings/entities/rating.entity';
import { Ride } from '../rides/entities/ride.entity';
import { DriverProfile } from '../users/entities/driver-profile.entity';
import { UsersModule } from '../users/users.module';
import { DriverPresenceService } from './driver-presence.service';
import { DriversController } from './drivers.controller';
import { DriversService } from './drivers.service';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([DriverProfile, Ride, Rating]),
  ],
  controllers: [DriversController],
  providers: [DriversService, DriverPresenceService],
  exports: [DriversService, DriverPresenceService],
})
export class DriversModule {}
