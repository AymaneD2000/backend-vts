import { IsEnum, IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { VehicleType } from '../../users/entities/driver-profile.entity';

export class UpdateDriverProfileDto {
  @IsEnum(VehicleType)
  vehicleType: VehicleType;

  @IsString()
  @Length(2, 32)
  vehiclePlate: string;

  @IsString()
  @Length(2, 60)
  vehicleMake: string;

  @IsString()
  @Length(1, 60)
  vehicleModel: string;

  @IsString()
  @Length(2, 40)
  vehicleColor: string;

  @IsOptional()
  @IsInt()
  @Min(1980)
  @Max(2100)
  vehicleYear?: number;
}
