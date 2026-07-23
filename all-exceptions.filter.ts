import { Catch, ArgumentsHost, HttpException, HttpStatus } from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";

import { Request, Response } from "express";
import * as Sentry from "@sentry/nestjs";



@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
   console.error(exception)
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Something went wrong";

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = (exception as any).message || "Http error occurred";
    } 
    
  

    if (status >= 500) {
      Sentry.withScope((scope) => {

        
     
       
        scope.setExtras({
          url: request.url,
          method: request.method,
          body: request.body,
          query: request.query,
          headers: request.headers,
        });

      

       
        scope.setTag("module", "backend");
        scope.setTag("env", process.env.NODE_ENV);

        Sentry.captureException(exception);
      });
    }

    // Send response
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}