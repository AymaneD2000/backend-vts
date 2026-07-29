import { Module } from '@nestjs/common';
import { MerchantsModule } from '../merchants/merchants.module';
import { OrdersModule } from '../orders/orders.module';
import { RentalsModule } from '../rentals/rentals.module';
import { RidesModule } from '../rides/rides.module';
import { DiscoveryController } from './discovery.controller';
import { DiscoveryService } from './discovery.service';

// Owns no tables. Imports the existing feature modules and injects their
// services to fan out across rides, merchant commerce and rentals.
@Module({
  imports: [MerchantsModule, RidesModule, RentalsModule, OrdersModule],
  controllers: [DiscoveryController],
  providers: [DiscoveryService],
})
export class DiscoveryModule {}
