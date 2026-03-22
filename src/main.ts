import './instrument'
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AllExceptionsFilter } from 'all-exceptions.filter';
import cookieParser from 'cookie-parser';


async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  
  const origins = process.env.ALLOWED_ORIGIN?.split(',')|| []

app.enableCors({
  origin: origins,
  credentials: true,
});

  app.use(cookieParser());

  app.useGlobalFilters(new AllExceptionsFilter());

  
 

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
