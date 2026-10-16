import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import * as express from 'express';
import { FallbackModule } from './fallback.module';

async function createApp() {
  const logger = new Logger('Bootstrap');

  // Try to initialize the full AppModule; if configuration validation fails
  // we fall back to a minimal module that only exposes health & disabled auth endpoints.
  try {
    const app = await NestFactory.create(AppModule.forRoot(), { bodyParser: true });

    // Enable CORS (allow frontend origin if set)
    const frontendOrigin = process.env.FRONTEND_ORIGIN || '*';
    app.enableCors({ origin: frontendOrigin, methods: ['GET','POST','PUT','DELETE','OPTIONS'], credentials: true });

    // Ensure urlencoded parser is configured so webhooks work
    const server = app.getHttpAdapter().getInstance() as express.Express;
    server.use(express.urlencoded({ extended: true }));

    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

    return { app, logger };
  } catch (err) {
    // Log the error but continue with a minimal fallback application
    const loggerFallback = new Logger('BootstrapFallback');
    loggerFallback.error('Failed to start full app module, starting fallback module instead', err as any);

    const app = await NestFactory.create(FallbackModule, { bodyParser: true });
    const frontendOrigin = process.env.FRONTEND_ORIGIN || '*';
    app.enableCors({ origin: frontendOrigin, methods: ['GET','POST','PUT','DELETE','OPTIONS'], credentials: true });
    const server = app.getHttpAdapter().getInstance() as express.Express;
    server.use(express.urlencoded({ extended: true }));
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

    return { app, logger: loggerFallback };
  }
}

async function bootstrap() {
  const { app, logger } = await createApp();

  const port = Number(process.env.PORT) || 4000;
  const host = process.env.HOST || '0.0.0.0';

  await app.listen(port, host);
  logger.log(`Application listening on: http://${host}:${port}`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal error during bootstrap', err);
  process.exit(1);
});
