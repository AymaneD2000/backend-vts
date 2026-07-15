import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { DriversModule } from './modules/drivers/drivers.module';
import { KycModule } from './modules/kyc/kyc.module';
import { MatchingModule } from './modules/matching/matching.module';
import { MerchantsModule } from './modules/merchants/merchants.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { RatingsModule } from './modules/ratings/ratings.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { RentalsModule } from './modules/rentals/rentals.module';
import { RidesModule } from './modules/rides/rides.module';
import { TrustModule } from './modules/trust/trust.module';
import { UsersModule } from './modules/users/users.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    EventEmitterModule.forRoot(),
    DatabaseModule,
    RedisModule,
    UsersModule,
    AuthModule,
    PricingModule,
    DriversModule,
    MatchingModule,
    RidesModule,
    RealtimeModule,
    NotificationsModule,
    RatingsModule,
    KycModule,
    TrustModule,
    RentalsModule,
    MerchantsModule,
    OrdersModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
