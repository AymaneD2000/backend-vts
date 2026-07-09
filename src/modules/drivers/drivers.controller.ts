import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DriversService } from './drivers.service';
import { GoOnlineDto, LocationDto } from './dto/driver.dto';

@UseGuards(JwtAuthGuard)
@Controller('drivers')
export class DriversController {
  constructor(private readonly drivers: DriversService) {}

  @Get('status')
  status(@CurrentUser('userId') userId: string) {
    return this.drivers.status(userId);
  }

  @Get('summary')
  summary(@CurrentUser('userId') userId: string) {
    return this.drivers.summary(userId);
  }

  @Post('online')
  @HttpCode(HttpStatus.OK)
  goOnline(
    @CurrentUser('userId') userId: string,
    @Body() dto: GoOnlineDto,
  ) {
    return this.drivers.goOnline(userId, {
      lat: dto.lat,
      lng: dto.lng,
    });
  }

  @Post('offline')
  @HttpCode(HttpStatus.OK)
  async goOffline(@CurrentUser('userId') userId: string) {
    await this.drivers.goOffline(userId);
    return { message: 'offline' };
  }

  @Post('location')
  @HttpCode(HttpStatus.OK)
  async updateLocation(
    @CurrentUser('userId') userId: string,
    @Body() dto: LocationDto,
  ) {
    await this.drivers.updateLocation(userId, { lat: dto.lat, lng: dto.lng });
    return { message: 'ok' };
  }
}
