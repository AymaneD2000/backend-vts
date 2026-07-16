import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCategoryImages1784250000000 implements MigrationInterface {
  name = 'AddCategoryImages1784250000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "product_categories" ADD COLUMN IF NOT EXISTS "image_url" character varying',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "product_categories" DROP COLUMN IF EXISTS "image_url"',
    );
  }
}
