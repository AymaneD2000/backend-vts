import { IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class CreateMerchantReviewDto {
  @IsUUID()
  orderId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  score: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}

export interface MerchantReviewDto {
  id: string;
  merchantId: string;
  orderId: string;
  customerId: string;
  score: number;
  comment: string | null;
  createdAt: string;
}
