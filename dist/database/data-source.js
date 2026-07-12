"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
exports.default = new typeorm_1.DataSource({
    type: 'postgres',
    ...(process.env.DATABASE_URL
        ? { url: process.env.DATABASE_URL }
        : {
            host: process.env.DB_HOST ?? 'localhost',
            port: parseInt(process.env.DB_PORT ?? '5432', 10),
            username: process.env.DB_USER ?? 'vts',
            password: process.env.DB_PASSWORD ?? 'vts',
            database: process.env.DB_NAME ?? 'vts',
        }),
    ssl: (process.env.DB_SSL ?? 'false') === 'true'
        ? { rejectUnauthorized: false }
        : false,
    entities: ['src/**/*.entity.ts'],
    migrations: ['src/database/migrations/*.ts'],
    synchronize: false,
});
//# sourceMappingURL=data-source.js.map