import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,

  
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

/**
 * ✅ Extend Express Request type to include `user`
 */
interface AuthenticatedRequest extends Request {
  user?: any;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    // ✅ Step 1: Read the authorization header safely
    const rawHeader =
      request.headers['authorization'] || request.headers['Authorization'];

    if (!rawHeader) {
      throw new UnauthorizedException('Authorization header missing');
    }

    // ✅ Step 2: Normalize — remove extra spaces and handle array type
    const headerValue = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;
    const normalizedHeader = headerValue.trim().replace(/\s+/g, ' ');

  

  
    // ✅ Step 3: Validate format ("Bearer <token>")
    if (!normalizedHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authorization header invalid');
    }

    // ✅ Step 4: Extract token
    const token = normalizedHeader.split(' ')[1];
    
    if (!token) {
      throw new UnauthorizedException('Token missing after Bearer');
    }

    try {
      // ✅ Step 5: Verify token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.ACCESS_TOKEN_SECRET,
      });

      // ✅ Step 6: Attach decoded payload to request for downstream access
      request.user = payload;

      return true;
    } catch (err) {
      
      throw new ForbiddenException('Invalid or expired token');
    }
  }
}
