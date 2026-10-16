import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { AuthController } from './auth/auth.controller';

@Module({
  controllers: [HealthController, AuthController]
})
export class FallbackModule {}
