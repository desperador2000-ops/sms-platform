import fs from 'fs';
import path from 'path';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.preprocess((v) => Number(v), z.number().int().positive().default(4000)),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  BULLMQ_PREFIX: z.string().default('sms_platform'),
  JWT_PRIVATE_KEY: z.string().min(32),
  JWT_PUBLIC_KEY: z.string().min(32),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('30d'),
  AES_MASTER_KEY: z.string().min(32),
  SENDGRID_API_KEY: z.string().min(1),
  SENDGRID_FROM: z.string().min(1),
  FRONTEND_ORIGIN: z.string().url().default('http://localhost:3000'),
  SENTRY_DSN: z.string().optional(),
  METRICS_ENABLED: z.preprocess((v) => v === 'true' || v === true, z.boolean()).default(true),
  PROVIDER_RATE_LIMITS: z.string().optional()
});

export type AppConfig = z.infer<typeof envSchema>;

export class ConfigService {
  private static _config: AppConfig;

  static loadAndValidate(): AppConfig {
    if (this._config) return this._config;
    const env = { ...process.env };
    const parseResult = envSchema.safeParse(env);
    if (!parseResult.success) {
      console.error('Invalid environment configuration:', parseResult.error.format());
      throw new Error('Invalid environment configuration. See logs for details.');
    }
    this._config = parseResult.data;
    return this._config;
  }

  static get(): AppConfig {
    if (!this._config) return this.loadAndValidate();
    return this._config;
  }

  static writeEnvExample(destPath: string) {
    const example = [
      '# Copy to .env and fill values',
      `NODE_ENV=${this._config?.NODE_ENV ?? 'development'}`,
      `PORT=${this._config?.PORT ?? 4000}`,
      'DATABASE_URL=postgresql://user:pass@localhost:5432/sms_platform',
      'REDIS_URL=redis://localhost:6379/0',
      'BULLMQ_PREFIX=sms_platform',
      'JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----"',
      'JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\\n...\\n-----END PUBLIC KEY-----"',
      'AES_MASTER_KEY=replace_with_base64_32_byte_key',
      'SENDGRID_API_KEY=SG.xxxxx',
      'SENDGRID_FROM=no-reply@yourdomain.com',
      'FRONTEND_ORIGIN=http://localhost:3000',
      'METRICS_ENABLED=true',
      'PROVIDER_RATE_LIMITS={"TWILIO":{"maxConcurrent":5,"minTime":200},"TELNYX":{"maxConcurrent":2,"minTime":500}}'
    ].join('\n');
    fs.writeFileSync(path.resolve(destPath), example, 'utf-8');
  }
}
