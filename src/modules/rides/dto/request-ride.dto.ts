import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ServiceType } from '../../../common/service-type';
import { PaymentMethod, ParcelSize } from '../entities/ride.entity';

class PlaceDto {
  @IsLatitude()
  lat: number;

  @IsLongitude()
  lng: number;

  @IsOptional()
  @IsString()
  address?: string;
}

export class RequestRideDto {
  @IsEnum(ServiceType)
  serviceType: ServiceType;

  @ValidateNested()
  @Type(() => PlaceDto)
  pickup: PlaceDto;

  @ValidateNested()
  @Type(() => PlaceDto)
  dropoff: PlaceDto;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  // --- Parcel fields, required only when serviceType === PARCEL ---

  // Declared value in FCFA (required for parcels — drives the trust gate).
  @ValidateIf((o) => o.serviceType === ServiceType.PARCEL)
  @IsInt()
  @Min(1)
  declaredValue?: number;

  @ValidateIf((o) => o.serviceType === ServiceType.PARCEL)
  @IsString()
  @MaxLength(500)
  parcelDescription?: string;

  @ValidateIf((o) => o.serviceType === ServiceType.PARCEL)
  @IsString()
  @MaxLength(120)
  recipientName?: string;

  @ValidateIf((o) => o.serviceType === ServiceType.PARCEL)
  @IsString()
  @MaxLength(20)
  recipientPhone?: string;

  @ValidateIf((o) => o.serviceType === ServiceType.PARCEL)
  @IsEnum(ParcelSize)
  parcelSize?: ParcelSize;
}
