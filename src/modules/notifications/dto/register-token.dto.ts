import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { DevicePlatform } from '../entities/device-token.entity';

export class RegisterTokenDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsOptional()
  @IsEnum(DevicePlatform)
  platform?: DevicePlatform;
}

export class UnregisterTokenDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}
