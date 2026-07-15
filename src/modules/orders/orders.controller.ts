import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CheckoutOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { OrdersService } from './orders.service';

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post('checkout')
  checkout(
    @CurrentUser('userId') userId: string,
    @Body() dto: CheckoutOrderDto,
  ) {
    return this.orders.checkout(userId, dto);
  }

  @Get('mine')
  mine(@CurrentUser('userId') userId: string) {
    return this.orders.customerOrders(userId);
  }

  @Get('mine/:id')
  mineById(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.orders.customerOrder(userId, id);
  }

  @Post('mine/:id/cancel')
  cancel(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.orders.cancelByCustomer(userId, id);
  }

  @Get('merchant')
  merchantOrders(@CurrentUser('userId') userId: string) {
    return this.orders.merchantOrders(userId);
  }

  @Get('merchant/:merchantId/analytics')
  analytics(
    @CurrentUser('userId') userId: string,
    @Param('merchantId') merchantId: string,
  ) {
    return this.orders.merchantAnalytics(userId, merchantId);
  }

  @Patch('merchant/:id/status')
  updateStatus(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orders.updateByMerchant(userId, id, dto);
  }
}
