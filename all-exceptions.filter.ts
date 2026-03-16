import { Catch, ArgumentsHost, HttpException, HttpStatus } from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";
import { MongoError } from "mongodb";
import { Request, Response } from "express";
import * as Sentry from "@sentry/nestjs";

// Custom M-Pesa error
export class MpesaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MpesaError";
  }
}

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Something went wrong";

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = (exception as any).message || "Http error occurred";
    } else if (exception instanceof MongoError) {
      status = HttpStatus.BAD_REQUEST;
      message = "A database error occurred";
    } else if (exception instanceof MpesaError) {
      status = HttpStatus.BAD_GATEWAY;
      message = exception.message || "M-Pesa transaction failed";
    } else if (exception instanceof Error) {
      message = exception.message;
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