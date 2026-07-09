import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewKycDto {
  @IsBoolean()
  approve: boolean;

  // Required in practice when rejecting; shown to the driver.
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
