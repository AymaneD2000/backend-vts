"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => {
    const env = process.env.NODE_ENV ?? 'development';
    const synchronizeDefault = env === 'production' ? 'false' : 'true';
    return {
        env,
        port: parseInt(process.env.PORT ?? '3000', 10),
        database: {
            host: process.env.DB_HOST ?? 'localhost',
            port: parseInt(process.env.DB_PORT ?? '5432', 10),
            user: process.env.DB_USER ?? 'vts',
            password: process.env.DB_PASSWORD ?? 'vts',
            name: process.env.DB_NAME ?? 'vts',
            synchronize: (process.env.DB_SYNCHRONIZE ?? synchronizeDefault) === 'true',
        },
        redis: {
            host: process.env.REDIS_HOST ?? 'localhost',
            port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
        },
        jwt: {
            accessSecret: process.env.JWT_ACCESS_SECRET ?? 'change_me_access',
            accessTtl: process.env.JWT_ACCESS_TTL ?? '900s',
            refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'change_me_refresh',
            refreshTtl: process.env.JWT_REFRESH_TTL ?? '30d',
        },
        otp: {
            ttlSeconds: parseInt(process.env.OTP_TTL_SECONDS ?? '300', 10),
            length: parseInt(process.env.OTP_LENGTH ?? '6', 10),
            smsProvider: process.env.SMS_PROVIDER ?? 'console',
        },
        push: {
            provider: process.env.PUSH_PROVIDER ?? 'console',
            credentialsFile: process.env.GOOGLE_APPLICATION_CREDENTIALS ?? '',
        },
        admin: {
            phones: (process.env.ADMIN_PHONES ?? '')
                .split(',')
                .map((p) => p.trim())
                .filter((p) => p.length > 0),
        },
        kyc: {
            uploadDir: process.env.KYC_UPLOAD_DIR ?? 'uploads/kyc',
        },
    };
};
//# sourceMappingURL=configuration.js.map