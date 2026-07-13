export default () => {
  const env = process.env.NODE_ENV ?? 'development';
  // Auto schema sync is convenient in dev but unsafe in production, where
  // migrations must be used. Default off in production unless explicitly on.
  const synchronizeDefault = env === 'production' ? 'false' : 'true';
  return {
    env,
    port: parseInt(process.env.PORT ?? '3000', 10),
    database: {
      url: process.env.DATABASE_URL ?? '',
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432', 10),
      user: process.env.DB_USER ?? 'vts',
      password: process.env.DB_PASSWORD ?? 'vts',
      name: process.env.DB_NAME ?? 'vts',
      synchronize: (process.env.DB_SYNCHRONIZE ?? synchronizeDefault) === 'true',
      migrationsRun: (process.env.DB_MIGRATIONS_RUN ?? 'false') === 'true',
      ssl: (process.env.DB_SSL ?? 'false') === 'true',
    },
    redis: {
      url: process.env.REDIS_URL ?? '',
      host: process.env.REDIS_HOST ?? 'localhost',
      port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
      password: process.env.REDIS_PASSWORD ?? '',
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
      cooldownSeconds: parseInt(
        process.env.OTP_COOLDOWN_SECONDS ?? '60',
        10,
      ),
      maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS ?? '5', 10),
      smsProvider: process.env.SMS_PROVIDER ?? 'console',
    },
    email: {
      provider: process.env.EMAIL_PROVIDER ?? 'console',
      host: process.env.SMTP_HOST ?? '',
      port: parseInt(process.env.SMTP_PORT ?? '587', 10),
      secure: (process.env.SMTP_SECURE ?? 'false') === 'true',
      user: process.env.SMTP_USER ?? '',
      password: process.env.SMTP_PASSWORD ?? '',
      from: process.env.EMAIL_FROM ?? 'VTS Mali <no-reply@localhost>',
    },
    push: {
      provider: process.env.PUSH_PROVIDER ?? 'console',
      // Path to a Firebase service-account JSON. When set (and provider is
      // 'fcm') real push delivery is enabled; otherwise we fall back to console.
      credentialsFile: process.env.GOOGLE_APPLICATION_CREDENTIALS ?? '',
    },
    admin: {
      // Comma-separated phone numbers granted the admin role on login.
      phones: (process.env.ADMIN_PHONES ?? '')
        .split(',')
        .map((p) => p.trim())
        .filter((p) => p.length > 0),
      emails: (process.env.ADMIN_EMAILS ?? '')
        .split(',')
        .map((email) => email.trim().toLowerCase())
        .filter((email) => email.length > 0),
    },
    kyc: {
      uploadDir: process.env.KYC_UPLOAD_DIR ?? 'uploads/kyc',
    },
    merchant: {
      logoDir:
        process.env.MERCHANT_LOGO_DIR ?? 'uploads/merchant-logos',
    },
  };
};
