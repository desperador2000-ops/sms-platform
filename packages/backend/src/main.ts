import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from './config/configuration';
import { PrismaService } from './prisma/prisma.service';
import { setupSwagger } from './swagger/swagger.config';

async function bootstrap() {
  const config = ConfigService.loadAndValidate();

  const app = await NestFactory.create(AppModule.forRoot(config), {
    logger: ['log', 'error', 'warn', 'debug', 'verbose']
  });

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'"],
          imgSrc: ["'self'", 'data:']
        }
      },
      crossOriginEmbedderPolicy: false
    })
  );

  app.enableCors({
    origin: config.FRONTEND_ORIGIN,
    credentials: true
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true
    })
  );

  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    next();
  });

  setupSwagger(app);

  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  const port = config.PORT ?? 4000;
  await app.listen(port);
  console.log(`Backend running on port ${port}`);
  console.log(`Swagger docs: http://localhost:${port}/docs`);
  console.log(`Health: http://localhost:${port}/health`);
}

bootstrap().catch((err) => {
  console.error('Fatal error during bootstrap', err);
  process.exit(1);
});
