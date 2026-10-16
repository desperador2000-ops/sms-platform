import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  // Temporary: disable auth endpoints to avoid broken signup/login flows

  @Post('send-otp')
  async sendOtp(@Body() body: any) {
    throw new HttpException(
      {
        status: 'disabled',
        message: 'Authentication / OTP sending is temporarily disabled by the administrator.'
      },
      HttpStatus.SERVICE_UNAVAILABLE
    );
  }

  @Post('register')
  async register(@Body() body: any) {
    throw new HttpException(
      {
        status: 'disabled',
        message: 'Registration is temporarily disabled by the administrator.'
      },
      HttpStatus.SERVICE_UNAVAILABLE
    );
  }

  @Post('login')
  async login(@Body() body: any) {
    throw new HttpException(
      {
        status: 'disabled',
        message: 'Login is temporarily disabled by the administrator.'
      },
      HttpStatus.SERVICE_UNAVAILABLE
    );
  }
}
