import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { DiscoveryModule } from './modules/discovery/discovery.module';
import { DriversModule } from './modules/drivers/drivers.module';
import { KycModule } from './modules/kyc/kyc.module';
import { MatchingModule } from './modules/matching/matching.module';
import { MerchantsModule } from './modules/merchants/merchants.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { RatingsModule } from './modules/ratings/ratings.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { RentalsModule } from './modules/rentals/rentals.module';
import { RidesModule } from './modules/rides/rides.module';
import { TrustModule } from './modules/trust/trust.module';
import { UsersModule } from './modules/users/users.module';
import { RedisModule } from './redis/redis.module';
import { ActionRateLimitModule } from './common/action-rate-limit.module';
import { ApplicationExceptionFilter } from './common/application-exception.filter';
import { AuthorizationModule } from './common/authorization.module';
import { InventoryModule } from './modules/inventory/inventory.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    EventEmitterModule.forRoot(),
    DatabaseModule,
    RedisModule,
    AuthorizationModule,
    ActionRateLimitModule,
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
    DiscoveryModule,
    InventoryModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_FILTER, useClass: ApplicationExceptionFilter }],
})
export class AppModule {}
