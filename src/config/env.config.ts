import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV,
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM,
  },
  storage: {
    localPath: process.env.STORAGE_LOCAL_PATH || './uploads',
  },
  featureFlags: {
    crm: process.env.FEATURE_FLAG_CRM || 'true',
    pms: process.env.FEATURE_FLAG_PMS || 'true',
    hr: process.env.FEATURE_FLAG_HR || 'true',
    finance: process.env.FEATURE_FLAG_FINANCE || 'true',
    seo: process.env.FEATURE_FLAG_SEO || 'true',
    telemetry: process.env.FEATURE_FLAG_TELEMETRY || 'true',
  },
  auth: {
    lockoutTimeMs: parseInt(process.env.AUTH_LOCKOUT_TIME_MS || '900000', 10), // 15 mins
    maxLoginAttempts: parseInt(process.env.AUTH_MAX_LOGIN_ATTEMPTS || '5', 10),
    passwordExpiryDays: parseInt(process.env.AUTH_PASSWORD_EXPIRY_DAYS || '90', 10),
    passwordHistoryLimit: parseInt(process.env.AUTH_PASSWORD_HISTORY_LIMIT || '5', 10),
    passwordMinLength: parseInt(process.env.AUTH_PASSWORD_MIN_LENGTH || '8', 10),
    passwordRequireUppercase: (process.env.AUTH_PASSWORD_REQ_UPPER || 'true') === 'true',
    passwordRequireLowercase: (process.env.AUTH_PASSWORD_REQ_LOWER || 'true') === 'true',
    passwordRequireNumber: (process.env.AUTH_PASSWORD_REQ_NUMBER || 'true') === 'true',
    passwordRequireSpecialChar: (process.env.AUTH_PASSWORD_REQ_SPECIAL || 'true') === 'true',
    rateLimitLoginMax: parseInt(process.env.RATE_LIMIT_LOGIN_MAX || '5', 10),
    rateLimitLoginWindowMs: parseInt(process.env.RATE_LIMIT_LOGIN_WINDOW_MS || '60000', 10), // 1 min
    rateLimitForgotMax: parseInt(process.env.RATE_LIMIT_FORGOT_MAX || '3', 10),
    rateLimitForgotWindowMs: parseInt(process.env.RATE_LIMIT_FORGOT_WINDOW_MS || '900000', 10), // 15 mins
    rateLimitResetMax: parseInt(process.env.RATE_LIMIT_RESET_MAX || '3', 10),
    rateLimitResetWindowMs: parseInt(process.env.RATE_LIMIT_RESET_WINDOW_MS || '900000', 10), // 15 mins
  },
}));
