import {
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { MongoError } from 'mongodb';
import { Request, Response } from 'express';

/** 🔹 Custom Business Exceptions */
export class MpesaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MpesaError';
  }
}

export class PaypalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PaypalError';
  }
}

export class StripeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StripeError';
  }
}

/** 🔹 Universal Exception Filter (Fixed for RTK Query compatibility) */
@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorResponse: any = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: 'Something went wrong',
    };

    // 🧩 1. NestJS HttpExceptions (e.g. BadRequest, Unauthorized, etc.)
    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      status = exception.getStatus();

      if (typeof res === 'string') {
        // if response is just a message string
        errorResponse.message = res;
      } else {
        // merge the NestJS structured error object
        errorResponse = {
          statusCode: status,
          timestamp: new Date().toISOString(),
          path: request.url,
          ...res,
        };
      }

    // 🧩 2. MongoDB errors
    } else if (exception instanceof MongoError) {
      status = HttpStatus.BAD_REQUEST;
      errorResponse.message = 'Database operation failed';

    // 🧩 3. Custom business logic errors
    } else if (exception instanceof MpesaError) {
      status = HttpStatus.BAD_GATEWAY;
      errorResponse.message = exception.message || 'M-Pesa transaction failed';
    } else if (exception instanceof PaypalError) {
      status = HttpStatus.BAD_GATEWAY;
      errorResponse.message = exception.message || 'PayPal transaction failed';
    } else if (exception instanceof StripeError) {
      status = HttpStatus.BAD_GATEWAY;
      errorResponse.message = exception.message || 'Stripe transaction failed';

    // 🧩 4. Regular JS errors
    } else if (exception instanceof Error) {
      errorResponse.message = exception.message;
    }

    // ✅ send structured error JSON
    response.status(status).json(errorResponse);
  }
}
