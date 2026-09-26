import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SetProductStockDto } from './dto/inventory.dto';
import { InventoryService } from './inventory.service';

@UseGuards(JwtAuthGuard)
@Controller('merchants/mine')
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Patch(':merchantId/products/:productId/inventory')
  setStock(
    @CurrentUser('userId') userId: string,
    @Param('merchantId') merchantId: string,
    @Param('productId') productId: string,
    @Body() dto: SetProductStockDto,
  ) {
    return this.inventory.setStock(userId, merchantId, productId, dto);
  }
}
