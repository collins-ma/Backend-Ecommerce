import {
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { MongoError } from 'mongodb';
import { Request, Response } from 'express';


export class MpesaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MpesaError';
  }
}


@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Something went wrong';

    
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const r = res as any;

      
        if (Array.isArray(r.message)) {
          message = r.message.join(', ');
        } else if (r.message) {
          message = r.message;
        }
      }
    }

    
    else if (exception instanceof MongoError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'An error ocurred please try again later';
    }

    
    else if (exception instanceof MpesaError) {
      status = HttpStatus.BAD_GATEWAY;
      message = exception.message || 'M-Pesa transaction failed';
    }

    
    else if (exception instanceof Error) {
      message = exception.message;
    }

  
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}