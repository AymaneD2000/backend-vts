import { IsString, IsNumber, IsOptional, Min, MaxLength, Matches } from 'class-validator';

export class InitiateCollectionDto {
  @IsString()
  @MaxLength(100)
  idempotencyKey: string;

  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  @MaxLength(20)
  @Matches(/^\+?\d+$/, { message: 'Invalid phone number format' })
  phone: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  orderId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  rideId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  userId?: string;
}