import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../../common/current-user.decorator';
import { Roles } from '../../common/roles.decorator';
import { RolesGuard } from '../../common/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '../users/entities/user.entity';
import { ApplyMerchantDto } from './dto/apply-merchant.dto';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
import { MerchantsService } from './merchants.service';

interface MerchantLogoFile {
  filename: string;
}

@UseGuards(JwtAuthGuard)
@Controller('merchants')
export class MerchantsController {
  constructor(private readonly merchants: MerchantsService) {}

  // --- Admin ---

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateMerchantDto) {
    return this.merchants.create(dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  list() {
    return this.merchants.list();
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateMerchantDto) {
    return this.merchants.update(id, dto);
  }

  // --- Owner ---

  @Get('mine')
  mine(@CurrentUser('userId') userId: string) {
    return this.merchants.myMerchants(userId);
  }

  // Every signed-in user can discover active shops and restaurants.
  @Get('active')
  active() {
    return this.merchants.activeMerchants();
  }

  @Post('mine/apply')
  apply(
    @CurrentUser('userId') userId: string,
    @Body() dto: ApplyMerchantDto,
  ) {
    return this.merchants.apply(userId, dto);
  }

  @Post('mine/:id/logo')
  @UseInterceptors(FileInterceptor('file'))
  uploadLogo(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: MerchantLogoFile,
  ) {
    return this.merchants.saveLogo(userId, id, file.filename);
  }

  @Post('mine/deliveries')
  createDelivery(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateDeliveryDto,
  ) {
    return this.merchants.createDelivery(userId, dto);
  }

  @Get('mine/deliveries')
  myDeliveries(@CurrentUser('userId') userId: string) {
    return this.merchants.myDeliveries(userId);
  }

  @Post('mine/deliveries/:id/dispatch')
  dispatchDelivery(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.merchants.dispatchDelivery(userId, id);
  }
}
