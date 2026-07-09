import { IsEnum } from 'class-validator';
import { KycDocumentType } from '../entities/kyc-document.entity';

export class UploadDocumentDto {
  @IsEnum(KycDocumentType)
  type: KycDocumentType;
}
