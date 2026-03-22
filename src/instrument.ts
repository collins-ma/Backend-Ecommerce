// src/instrument.ts
import * as Sentry from "@sentry/nestjs";
import * as dotenv from 'dotenv';

dotenv.config(); 

console.log("SENTRY_DSN:", process.env.SENTRY_DSN);
console.log("NODE_ENV:", process.env.NODE_ENV);



Sentry.init({
  dsn: process.env.SENTRY_DSN ,
  environment: process.env.NODE_ENV || "development",
 
  tracesSampleRate: 0,        
});