import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DriversModule } from '../drivers/drivers.module';
import { RidesModule } from '../rides/rides.module';
import { RealtimeGateway } from './realtime.gateway';

@Module({
  imports: [JwtModule.register({}), DriversModule, RidesModule],
  providers: [RealtimeGateway],
})
export class RealtimeModule {}
