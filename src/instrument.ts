// src/instrument.ts
import * as Sentry from "@sentry/nestjs";
import * as dotenv from 'dotenv';

dotenv.config(); 


Sentry.init({
  dsn: process.env.SENTRY_DSN ,
  environment: process.env.NODE_ENV || "development",
 
  tracesSampleRate: 0,        
});