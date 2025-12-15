import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import * as bodyParser from 'body-parser';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AllExceptionsFilter } from 'all-exceptions.filter';
import cookieParser from 'cookie-parser';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  app.enableCors({
    origin: 'http://localhost:5173',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.use(cookieParser());

  app.useGlobalFilters(new AllExceptionsFilter());

  // ✅ FIXED STATIC PATH
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  app.use(
    '/payments/callbacks/stripe',
    bodyParser.raw({ type: 'application/json' }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
