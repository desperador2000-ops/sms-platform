import { Module, DynamicModule } from '@nestjs/common';
import { ConfigService } from './config/configuration';
import { PrismaService } from './prisma/prisma.service';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { WebhooksModule } from './webhooks/webhooks.module';

@Module({})
export class AppModule {
  static forRoot(config = ConfigService.loadAndValidate()): DynamicModule {
    return {
      module: AppModule,
      imports: [
        ThrottlerModule.forRoot({
          ttl: 60 * 10, // 10 minutes
          limit: 100 // sensible global default; per-route overrides below
        }),
        AuthModule,
        WebhooksModule
      ],
      providers: [
        PrismaService,
        {
          provide: APP_GUARD,
          useClass: ThrottlerGuard
        }
      ],
      exports: [PrismaService]
    };
  }
}
