import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsISO8601,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaymentMethod } from '../../rides/entities/ride.entity';
import { OrderStatus } from '../entities/order.entity';

export class CheckoutItemDto {
  @IsUUID()
  productId: string;

  @IsInt()
  @Min(1)
  @Max(50)
  quantity: number;
}

export class CheckoutOrderDto {
  @IsUUID()
  merchantId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items: CheckoutItemDto[];

  @IsString()
  @MaxLength(160)
  customerName: string;

  @IsString()
  @MaxLength(30)
  customerPhone: string;

  @IsString()
  @MaxLength(500)
  deliveryAddress: string;

  @IsLatitude()
  deliveryLat: number;

  @IsLongitude()
  deliveryLng: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsISO8601()
  scheduledAt?: string;
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
