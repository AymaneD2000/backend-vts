import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CancelRideDto } from './dto/cancel-ride.dto';
import { RequestRideDto } from './dto/request-ride.dto';
import { RidesService } from './rides.service';

@UseGuards(JwtAuthGuard)
@Controller('rides')
export class RidesController {
  constructor(private readonly rides: RidesService) {}

  @Post()
  request(
    @CurrentUser('userId') userId: string,
    @Body() dto: RequestRideDto,
  ) {
    return this.rides.request(userId, dto);
  }

  @Get()
  list(@CurrentUser('userId') userId: string) {
    return this.rides.list(userId);
  }

  @Get(':id')
  get(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.rides.get(id, userId);
  }

  @Post(':id/accept')
  @HttpCode(HttpStatus.OK)
  accept(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.rides.accept(id, userId);
  }

  @Post(':id/start')
  @HttpCode(HttpStatus.OK)
  start(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.rides.start(id, userId);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  complete(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.rides.complete(id, userId);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: CancelRideDto,
  ) {
    return this.rides.cancel(id, userId, dto);
  }
}
