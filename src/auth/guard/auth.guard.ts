import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,

  
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';


interface AuthenticatedRequest extends Request {
  user?: any;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

   
    const rawHeader =
      request.headers['authorization'] || request.headers['Authorization'];

    if (!rawHeader) {
      throw new UnauthorizedException('Authorization header missing');
    }

    
    const headerValue = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;
    const normalizedHeader = headerValue.trim().replace(/\s+/g, ' ');

  

  
    
    if (!normalizedHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authorization header invalid');
    }

   
    const token = normalizedHeader.split(' ')[1];

    
    
    if (!token) {
      throw new UnauthorizedException('Token missing after Bearer');
    }

    try {
      
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.ACCESS_TOKEN_SECRET,
      });

      
      request.user = payload;

      return true;
    } catch (err) {
      
      throw new ForbiddenException('Invalid or expired token');
    }
  }
}
