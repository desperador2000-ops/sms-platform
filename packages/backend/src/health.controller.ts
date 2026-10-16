import { Controller, Get } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL);

@Controller('/health')
export class HealthController {
  @Get()
  async getHealth() {
    const checks: any = { uptime: process.uptime() };

    // DB check
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = 'ok';
    } catch (err) {
      checks.database = 'error';
      checks.databaseError = (err as Error).message;
    }

    // Redis check
    try {
      const pong = await redis.ping();
      checks.redis = pong === 'PONG' ? 'ok' : `resp:${pong}`;
    } catch (err) {
      checks.redis = 'error';
      checks.redisError = (err as Error).message;
    }

    checks.env = {
      NODE_ENV: process.env.NODE_ENV || 'development',
    };

    // simple overall status
    const ok = checks.database === 'ok' && checks.redis === 'ok';
    return { status: ok ? 'ok' : 'degraded', checks };
  }
}
