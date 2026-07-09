import { IsInt, IsOptional, Min, ValidateIf } from 'class-validator';
import { TrustLevel } from '../../../common/trust-level';

// Updates the declared-value cap for a given trust level. A null cap means
// unlimited (used for the top tier).
export class UpdateTrustConfigDto {
  @IsInt()
  @Min(TrustLevel.KYC_SIMPLE)
  trustLevel: TrustLevel;

  @ValidateIf((o) => o.maxDeclaredValue !== null)
  @IsInt()
  @Min(0)
  maxDeclaredValue: number | null;
}
