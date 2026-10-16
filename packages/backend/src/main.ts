import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import * as express from 'express';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule.forRoot(), { bodyParser: true });

  // Enable CORS (allow frontend origin if set)
  const frontendOrigin = process.env.FRONTEND_ORIGIN || '*';
  app.enableCors({ origin: frontendOrigin, methods: ['GET','POST','PUT','DELETE','OPTIONS'], credentials: true });

  // Ensure urlencoded parser is configured so webhooks work
  const server = app.getHttpAdapter().getInstance() as express.Express;
  server.use(express.urlencoded({ extended: true }));

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

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
