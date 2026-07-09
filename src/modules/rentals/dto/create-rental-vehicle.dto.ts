import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { RentalCategory } from '../entities/rental-vehicle.entity';

export class CreateRentalVehicleDto {
  @IsString()
  @MaxLength(120)
  name: string;

  @IsEnum(RentalCategory)
  category: RentalCategory;

  // Price per rental day, in XOF (FCFA).
  @IsInt()
  @Min(1)
  dailyPrice: number;

  // How many units of this vehicle the owner has. Defaults to 1.
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}
