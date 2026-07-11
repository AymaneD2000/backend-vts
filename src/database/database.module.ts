import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('database.url');
        const ssl = config.get<boolean>('database.ssl')
          ? { rejectUnauthorized: false }
          : false;
        return {
          type: 'postgres',
          ...(url
            ? { url }
            : {
                host: config.get<string>('database.host'),
                port: config.get<number>('database.port'),
                username: config.get<string>('database.user'),
                password: config.get<string>('database.password'),
                database: config.get<string>('database.name'),
              }),
          ssl,
          autoLoadEntities: true,
          synchronize: config.get<boolean>('database.synchronize'),
        };
      },
    }),
  ],
})
export class DatabaseModule {}
