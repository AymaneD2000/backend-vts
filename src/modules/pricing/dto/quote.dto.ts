import { Type } from 'class-transformer';
import { IsEnum, IsLatitude, IsLongitude, ValidateNested } from 'class-validator';
import { ServiceType } from '../../../common/service-type';

class PointDto {
  @IsLatitude()
  lat: number;

  @IsLongitude()
  lng: number;
}

export class QuoteDto {
  @IsEnum(ServiceType)
  serviceType: ServiceType;

  @ValidateNested()
  @Type(() => PointDto)
  pickup: PointDto;

  @ValidateNested()
  @Type(() => PointDto)
  dropoff: PointDto;
}
