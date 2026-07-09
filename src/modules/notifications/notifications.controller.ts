import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DevicePlatform } from './entities/device-token.entity';
import {
  RegisterTokenDto,
  UnregisterTokenDto,
} from './dto/register-token.dto';
import { NotificationsService } from './notifications.service';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Post('tokens')
  @HttpCode(HttpStatus.OK)
  async register(
    @CurrentUser('userId') userId: string,
    @Body() dto: RegisterTokenDto,
  ) {
    await this.notifications.registerToken(
      userId,
      dto.token,
      dto.platform ?? DevicePlatform.ANDROID,
    );
    return { message: 'ok' };
  }

  @Post('tokens/remove')
  @HttpCode(HttpStatus.OK)
  async unregister(@Body() dto: UnregisterTokenDto) {
    await this.notifications.unregisterToken(dto.token);
    return { message: 'ok' };
  }
}
