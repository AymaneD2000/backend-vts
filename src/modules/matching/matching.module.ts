import { Module } from '@nestjs/common';
import { DriversModule } from '../drivers/drivers.module';
import { MatchingService } from './matching.service';

@Module({
  imports: [DriversModule],
  providers: [MatchingService],
  exports: [MatchingService],
})
export class MatchingModule {}
