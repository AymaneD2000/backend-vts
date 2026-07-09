import { IsOptional, IsUUID, ValidateIf } from 'class-validator';

// Links a driver to a guarantor (Level 2) or a partner company (Level 3).
// Pass guarantorId or partnerCompanyId; pass neither to clear both links.
// (null is sent as omitted — the service treats an absent id as "unset".)
export class AssignTrustDto {
  @IsUUID()
  driverUserId: string;

  @IsOptional()
  @ValidateIf((o) => o.guarantorId !== null)
  @IsUUID()
  guarantorId?: string | null;

  @IsOptional()
  @ValidateIf((o) => o.partnerCompanyId !== null)
  @IsUUID()
  partnerCompanyId?: string | null;
}
