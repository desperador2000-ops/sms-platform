import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import axios from 'axios';

@Controller('auth')
export class AuthController {
  // Protect /auth/send-otp from abuse: 5 requests per 10 minutes per IP
  @Post('send-otp')
  @Throttle(5, 600)
  async sendOtp(@Body() body: { phone: string; recaptchaToken?: string }) {
    const { phone, recaptchaToken } = body;
    // Basic validation
    if (!phone) throw new HttpException('phone is required', HttpStatus.BAD_REQUEST);

    // Recaptcha verification (if configured)
    const secret = process.env.RECAPTCHA_SECRET;
    if (secret) {
      if (!recaptchaToken) {
        throw new HttpException('recaptchaToken required', HttpStatus.BAD_REQUEST);
      }
      try {
        const resp = await axios.post(
          `https://www.google.com/recaptcha/api/siteverify?secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(recaptchaToken)}`
        );
        const data = resp.data;
        // For reCAPTCHA v3, check score (0.0 - 1.0). Adjust threshold as needed.
        if (!data.success || (typeof data.score === 'number' && data.score < 0.4)) {
          throw new HttpException('recaptcha verification failed', HttpStatus.FORBIDDEN);
        }
      } catch (err) {
        throw new HttpException('recaptcha verification error', HttpStatus.FORBIDDEN);
      }
    }

    // TODO: enqueue OTP send job (worker) and persist an OtpChallenge record
    // For now return accepted
    return { status: 'accepted' };
  }

  @Post('register')
  @Throttle(5, 3600) // slow down registrations per IP
  async register(@Body() body: { email: string; password: string; phone?: string }) {
    const { email, password } = body;
    if (!email || !password) throw new HttpException('email & password required', HttpStatus.BAD_REQUEST);

    // Minimal placeholder: create user flows handled elsewhere. For now, accept and return 201
    return { status: 'created' };
  }
}
