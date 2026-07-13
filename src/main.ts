import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { mkdirSync } from 'fs';
import { join, resolve } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api');

  const config = app.get(ConfigService);

  // Operator admin UI (static, no build) served at /admin.
  app.useStaticAssets(join(process.cwd(), 'public', 'admin'), {
    prefix: '/admin',
  });
  const merchantLogoDir = resolve(
    config.get<string>('merchant.logoDir') ?? 'uploads/merchant-logos',
  );
  mkdirSync(merchantLogoDir, { recursive: true });
  app.useStaticAssets(merchantLogoDir, { prefix: '/merchant-logos' });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.enableCors();

  const port = config.get<number>('port') ?? 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`VTS backend listening on http://localhost:${port}/api`);
}
bootstrap();
