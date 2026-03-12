import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
  } from '@nestjs/common';
  import { Reflector } from '@nestjs/core';
  import { ROLES_KEY } from '../decorators/roles.decorators';
  import { Request } from 'express';
  
  
  interface AuthenticatedRequest extends Request {
    user?: { role?: string; [key: string]: any };
  }
  
  @Injectable()
  export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}
  
    canActivate(context: ExecutionContext): boolean {
      const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
  
      if (!requiredRoles || requiredRoles.length === 0) {
       
        return false
      }
  
      const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
      const user = request.user;

      console.log(user)
      

      if (!user) {
        throw new ForbiddenException('User not found ');
      }
  
      
      if (!user.roles) {
        throw new ForbiddenException('User role missing ');
      }
  
      // Check if user's role matches any required role
      const hasRole = user.roles.some((role:string) => requiredRoles.includes(role));
  
      if (!hasRole) {
        throw new ForbiddenException('You do not have permission to access this resource');
      }
  
      return true;
    }
  }
  