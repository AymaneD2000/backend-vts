import {
  IsDateString,
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { PaymentMethod } from '../../rides/entities/ride.entity';

export class CreateBookingDto {
  @IsUUID()
  vehicleId: string;

  // ISO date (YYYY-MM-DD). The rental spans [startDate, endDate].
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  // Optional delivery / meeting point for the vehicle.
  @IsOptional()
  @IsLatitude()
  pickupLat?: number;

  @IsOptional()
  @IsLongitude()
  pickupLng?: number;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  pickupAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;
}
