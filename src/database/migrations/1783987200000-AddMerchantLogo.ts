import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMerchantLogo1783987200000 implements MigrationInterface {
  name = 'AddMerchantLogo1783987200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "merchants" ADD COLUMN IF NOT EXISTS "logo_url" character varying',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "merchants" DROP COLUMN IF EXISTS "logo_url"',
    );
  }
}
