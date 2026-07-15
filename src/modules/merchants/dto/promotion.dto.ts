import {
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PromotionType } from '../entities/promotion.entity';

export class CreatePromotionDto {
  @IsString()
  @MaxLength(160)
  name: string;

  @IsEnum(PromotionType)
  type: PromotionType;

  @IsInt()
  @Min(0)
  @Max(10000000)
  value: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minimumOrderAmount?: number;

  @IsISO8601()
  startsAt: string;

  @IsISO8601()
  endsAt: string;
}

export class UpdatePromotionDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsEnum(PromotionType)
  type?: PromotionType;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000000)
  value?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minimumOrderAmount?: number;

  @IsOptional()
  @IsISO8601()
  startsAt?: string;

  @IsOptional()
  @IsISO8601()
  endsAt?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
