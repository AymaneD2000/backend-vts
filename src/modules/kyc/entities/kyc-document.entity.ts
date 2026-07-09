import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

// The kinds of documents a driver must provide for verification.
export enum KycDocumentType {
  ID_CARD = 'id_card',
  DRIVER_LICENSE = 'driver_license',
  VEHICLE_REGISTRATION = 'vehicle_registration',
  PROFILE_PHOTO = 'profile_photo',
  VEHICLE_PHOTO = 'vehicle_photo',
}

// A single uploaded document file. Drivers replace (re-upload) a type rather
// than accumulate, so at most one current row per (user, type).
@Entity('kyc_documents')
@Index(['userId', 'type'], { unique: true })
export class KycDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'enum', enum: KycDocumentType })
  type: KycDocumentType;

  // Path on disk relative to the configured upload dir.
  @Column({ name: 'file_path' })
  filePath: string;

  @Column({ name: 'original_name' })
  originalName: string;

  @Column({ name: 'mime_type' })
  mimeType: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
