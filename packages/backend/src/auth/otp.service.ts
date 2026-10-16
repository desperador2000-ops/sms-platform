import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import argon2 from 'argon2';
import crypto from 'crypto';

const redis = new Redis(process.env.REDIS_URL);
const logger = new Logger('OtpService');

@Injectable()
export class OtpService {
  private phoneSendsKey(phone: string) { return `otp:sends:${phone}`; }
  private phoneDataKey(phone: string) { return `otp:data:${phone}`; }

  private generateCode(digits = 6) {
    const max = 10 ** digits;
    const n = crypto.randomInt(0, max);
    return n.toString().padStart(digits, '0');
  }

  async canSendToPhone(phone: string, maxPerHour = 3) {
    const key = this.phoneSendsKey(phone);
    const cur = await redis.get(key);
    return !(cur && Number(cur) >= maxPerHour);
  }

  async incrementSendCount(phone: string) {
    const key = this.phoneSendsKey(phone);
    const cur = await redis.incr(key);
    if (cur === 1) {
      await redis.expire(key, 3600); // 1 hour
    }
    return cur;
  }

  // Store OTP info in Redis hash with TTL (in seconds)
  async createOtp(phone: string, purpose = 'auth', ttlSeconds = 300) {
    if (!await this.canSendToPhone(phone)) {
      throw new HttpException('OTP send limit exceeded for this phone', HttpStatus.TOO_MANY_REQUESTS);
    }

    const code = this.generateCode(6);
    const codeHash = await argon2.hash(code);

    const dataKey = this.phoneDataKey(phone);
    await redis.hmset(dataKey, {
      codeHash,
      purpose,
      attempts: '0',
      createdAt: String(Date.now())
    });
    await redis.expire(dataKey, ttlSeconds);

    await this.incrementSendCount(phone);

    // enqueue job for SMS provider (placeholder): push to list
    const job = JSON.stringify({ type: 'send_sms', phone, message: `Your verification code is ${code}`, meta: { purpose } });
    try {
      await redis.lpush('sms:queue', job);
    } catch (err) {
      logger.error('Failed to enqueue SMS job', err as any);
    }

    // If in development, optionally return code for convenience
    if (process.env.DEV_RETURN_OTP === '1') return { code };
    return { status: 'queued' };
  }

  async verifyOtp(phone: string, code: string, maxAttempts = 5) {
    const dataKey = this.phoneDataKey(phone);
    const data = await redis.hgetall(dataKey);
    if (!data || !data.codeHash) {
      throw new HttpException('No OTP requested for this phone', HttpStatus.BAD_REQUEST);
    }

    if (data.lockedUntil) {
      const lockedUntil = Number(data.lockedUntil);
      if (Date.now() < lockedUntil) {
        throw new HttpException('OTP locked due to repeated failures', HttpStatus.TOO_MANY_REQUESTS);
      }
    }

    const matches = await argon2.verify(data.codeHash, code).catch(() => false);
    if (matches) {
      // success: delete otp key
      await redis.del(dataKey);
      return true;
    }

    // failure: increment attempts
    const attempts = Number(data.attempts || '0') + 1;
    const update: Record<string,string> = { attempts: String(attempts) };
    if (attempts >= maxAttempts) {
      const lockUntil = Date.now() + 15 * 60 * 1000; // 15 minutes
      update.lockedUntil = String(lockUntil);
    }
    await redis.hmset(dataKey, update);
    // preserve TTL
    const ttl = await redis.ttl(dataKey);
    if (ttl > 0) await redis.expire(dataKey, ttl);

    throw new HttpException('Invalid OTP', HttpStatus.UNAUTHORIZED);
  }
}
