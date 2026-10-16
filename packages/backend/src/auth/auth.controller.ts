import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import axios from 'axios';
import { OtpService } from './otp.service';
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prismaAvailable = Boolean(process.env.DATABASE_URL);
const prisma = prismaAvailable ? new PrismaClient() as any : null;

@Controller('auth')
export class AuthController {
  constructor(private readonly otpService: OtpService) {}

  // Send OTP to phone (protected by per-IP throttling / per-phone limit)
  @Post('send-otp')
  @Throttle(5, 600)
  async sendOtp(@Body() body: { phone: string; recaptchaToken?: string }) {
    const { phone, recaptchaToken } = body;
    if (!phone) throw new HttpException('phone required', HttpStatus.BAD_REQUEST);

    // Verify reCAPTCHA if configured
    const secret = process.env.RECAPTCHA_SECRET;
    if (secret) {
      if (!recaptchaToken) throw new HttpException('recaptcha token required', HttpStatus.BAD_REQUEST);
      const resp = await axios.post(`https://www.google.com/recaptcha/api/siteverify?secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(recaptchaToken)}`);
      const data = resp.data;
      if (!data.success || (typeof data.score === 'number' && data.score < 0.4)) {
        throw new HttpException('recaptcha verification failed', HttpStatus.FORBIDDEN);
      }
    }

    const result = await this.otpService.createOtp(phone);
    return result;
  }

  @Post('verify-otp')
  @Throttle(20, 600)
  async verifyOtp(@Body() body: { phone: string; code: string }) {
    const { phone, code } = body;
    if (!phone || !code) throw new HttpException('phone & code required', HttpStatus.BAD_REQUEST);
    await this.otpService.verifyOtp(phone, code);

    // At this point OTP is valid. If DB is available, you can create / fetch user and return session token.
    if (!prismaAvailable) {
      // DB not configured: return minimal success so frontend can proceed in staging/dev flows
      return { status: 'verified' };
    }

    // Example: find or create user by phone
    const user = await prisma.user.findUnique({ where: { email: null } }).catch(() => null);
    // In real schema, adapt to your user lookup (by phone field)
    // For safety, return verified status; do not auto-login if user model doesn't match
    return { status: 'verified' };
  }

  @Post('register')
  @Throttle(5, 3600)
  async register(@Body() body: { email: string; password: string; phone?: string }) {
    const { email, password, phone } = body;
    if (!email || !password) throw new HttpException('email & password required', HttpStatus.BAD_REQUEST);
    if (!prismaAvailable) throw new HttpException('Registration not available: DATABASE_URL not configured', HttpStatus.SERVICE_UNAVAILABLE);

    // Basic create user. Adapt to your schema: password hashing, unique email, etc.
    const existing = await prisma.user.findUnique({ where: { email } }).catch(() => null);
    if (existing) throw new HttpException('Email already registered', HttpStatus.CONFLICT);

    const hash = await argon2.hash(password);
    const created = await prisma.user.create({ data: { email, passwordHash: hash, locale: 'fr' } });
    // Do not return sensitive data
    return { status: 'created', userId: created.id };
  }

  @Post('login')
  @Throttle(10, 600)
  async login(@Body() body: { email: string; password: string }) {
    const { email, password } = body;
    if (!email || !password) throw new HttpException('email & password required', HttpStatus.BAD_REQUEST);
    if (!prismaAvailable) throw new HttpException('Login not available: DATABASE_URL not configured', HttpStatus.SERVICE_UNAVAILABLE);

    const user = await prisma.user.findUnique({ where: { email } }).catch(() => null);
    if (!user) throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    const ok = await argon2.verify(user.passwordHash, password).catch(() => false);
    if (!ok) throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);

    // Create session / JWT here. For now return a minimal success.
    return { status: 'ok', userId: user.id };
  }
}
