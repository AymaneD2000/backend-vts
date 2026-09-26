import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min, ValidateIf } from 'class-validator';

export class SetProductStockDto {
  @IsBoolean()
  trackInventory: boolean;

  @ValidateIf((dto) => dto.trackInventory)
  @IsInt()
  @Min(0)
  stockQuantity?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
