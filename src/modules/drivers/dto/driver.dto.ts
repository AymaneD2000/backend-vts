import { IsEnum, IsLatitude, IsLongitude, IsOptional } from 'class-validator';
import { VehicleType } from '../../users/entities/driver-profile.entity';

export class GoOnlineDto {
  @IsOptional()
  @IsEnum(VehicleType)
  vehicleType?: VehicleType;

  @IsLatitude()
  lat: number;

  @IsLongitude()
  lng: number;
}

export class LocationDto {
  @IsLatitude()
  lat: number;

  @IsLongitude()
  lng: number;
}
