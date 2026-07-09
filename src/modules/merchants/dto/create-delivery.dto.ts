import {
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { PaymentMethod } from '../../rides/entities/ride.entity';

export class CreateDeliveryDto {
  // Which of the owner's merchants is dispatching this delivery.
  @IsUUID()
  merchantId: string;

  // Customer drop-off point.
  @IsLatitude()
  customerLat: number;

  @IsLongitude()
  customerLng: number;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  customerAddress?: string;

  @IsString()
  @MaxLength(120)
  customerName: string;

  @IsString()
  @MaxLength(20)
  customerPhone: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;
}
