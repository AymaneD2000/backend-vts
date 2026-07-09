import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { CancelReason } from '../entities/ride.entity';

export class CancelRideDto {
  @IsOptional()
  @IsEnum(CancelReason)
  reason?: CancelReason;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
