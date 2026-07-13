import {
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { MerchantType } from '../entities/merchant.entity';

export class ApplyMerchantDto {
  @IsString()
  @MaxLength(150)
  name: string;

  @IsEnum(MerchantType)
  type: MerchantType;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsString()
  @MaxLength(300)
  address: string;

  @IsLatitude()
  lat: number;

  @IsLongitude()
  lng: number;
}
