import { Injectable, UnauthorizedException,NotFoundException , BadRequestException,InternalServerErrorException,ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import type { Response, Request } from 'express';
import {MailerService} from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid'; 
import { SessionService } from 'src/sessions/sessions.service';



@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
    private readonly sessionService: SessionService,
  ) {}

  // ------------------- VALIDATE USER -------------------
  async validateUser(username: string, password: string) {
    const user = await this.userService.findByUsername(username);
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password: _pwd, ...result } = user.toObject();
      return result;
    }
    throw new UnauthorizedException('Invalid credentials');
  }

  // ------------------- LOGIN -------------------
  async login(user: any, response: Response, req: Request) {
    try {

      const sessionId = uuidv4()
      const payload = { _id: user._id, roles: user.roles, username: user.username, sessionId };

      // Generate refresh token (long-lived)
      const refreshToken = this.jwtService.sign(payload, {
        secret: process.env.REFRESH_TOKEN_SECRET,
        expiresIn: '1d', 
      });

      
    


      await this.sessionService.createSession({
        sessionId,
        userId: user._id,
        refreshToken,
        userAgent: req.headers['user-agent']?.toString() || 'unknown',
        ipAddress: req.ip,
        expiresAt: new Date(Date.now() + 3 * 60 * 1000),
      });

      // Set refresh token as HTTP-only cookie
      response.cookie('jwt', refreshToken, {
        httpOnly: true,
         secure:true,
        sameSite: 'none',
        maxAge:  24*60* 60 * 1000, 
      });

      // Generate short-lived access token
      const accessToken = this.jwtService.sign(payload, {
        secret: process.env.ACCESS_TOKEN_SECRET,
        expiresIn: '1m',
      });

      return { accessToken };
    } catch (err) {
      
      throw new InternalServerErrorException('Login failed');
    }
  }

  // ------------------- REFRESH TOKEN -------------------
  async refreshToken(refreshToken: string, response:Response) {
    try {
      if (!refreshToken) {
        throw new UnauthorizedException('Unauthorized ');
      }

      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.REFRESH_TOKEN_SECRET,
      });

      const session = await this.sessionService.findSession(payload.sessionId);

      console.log('session Data',session)


      if (!session) {
        // Clear refresh token cookie because the session does not exist
        response.clearCookie('jwt', {
          httpOnly: true,
          secure: true,
          sameSite: 'none',
        });
      
       return response.status(401).json({message:"You are logged out.Please login again"})
      }




      


      // Generate new access token
      const accessToken = this.jwtService.sign(
        { _id: payload._id, roles: payload.roles, username: payload.username, sessionId: payload.sessionId },
        { secret: process.env.ACCESS_TOKEN_SECRET, expiresIn: '1m' }
      );

      // Optional: generate new refresh token if you want rotation
      // const newRefreshToken = this.jwtService.sign(payload, { secret: process.env.REFRESH_TOKEN_SECRET, expiresIn: '7d' });
      // response.cookie('jwt', newRefreshToken, { httpOnly: true, secure: false, sameSite: 'strict', maxAge: 7*24*60*60*1000 });

      return { accessToken };
    } catch (err: any) {
      console.error('Refresh token error:', err);

      if (err instanceof UnauthorizedException) {
        throw new UnauthorizedException('Unauthorized');
      }

      throw new ForbiddenException('Forbidden')

     
      
    }
  }

  // ------------------- LOGOUT -------------------
  // async logout(sessionId: string, res: Response) {
  //   // Remove session from DB
  //   await this.sessionService.logoutCurrent(sessionId, res);
  
  //   // Clear the refresh token cookie
  //   res.clearCookie('jwt', {
  //     httpOnly: true,
  //     secure: true,
  //     sameSite: 'none',
  //   });
  
  //   return { message: 'Logout successful' };
  
  async forgotPassword(email: string) {
    const user = await this.userService.findByEmail(email );
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1); // token valid 1 hour

    user.resetToken = token;
    user.resetTokenExpiry = expiry;
    await user.save();

    const resetLink = `${this.configService.get('BASE_URL')}/reset-password?token=${token}`;

    // Send real email (dev and prod)
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Reset Your Password',
      html: `
        <div style="
          font-family: Arial, sans-serif;
          background-color: #f9f9f9;
          padding: 40px;
        ">
          <div style="
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          ">
            <h2 style="
              color: #333333;
              font-size: 24px;
              margin-bottom: 20px;
              text-align: center;
            ">Reset Your Password</h2>
            
            <p style="font-size: 16px; color: #555555; line-height: 1.5;">
              Hello <strong>${user.username}</strong>,
            </p>
            
            <p style="font-size: 16px; color: #555555; line-height: 1.5;">
              You recently requested to reset your password. Click the button below to reset it:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="
                background-color: #4CAF50;
                color: white;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 6px;
                font-size: 16px;
                display: inline-block;
              ">Reset Password</a>
            </div>
            
            <p style="font-size: 14px; color: #999999; line-height: 1.5;">
              If you did not request a password reset, please ignore this email. This link will expire in 1 hour.
            </p>
    
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
    
            <p style="font-size: 12px; color: #aaaaaa; text-align: center;">
              &copy; ${new Date().getFullYear()} Your App Name. All rights reserved.
            </p>
          </div>
        </div>
      `,
    });

    console.log(`Reset link sent to ${user.email}: ${resetLink}`); // optional logging
    return { message: 'Reset link sent' };
  }

  async resetPassword(password: string, token: string) {
    const user = await this.userService.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() },
    });

    if (!user) throw new BadRequestException('Invalid or expired token');

    user.password = await bcrypt.hash(password, 10);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;

    await user.save();

    return { message: 'Password reset successfully' };
  }





}
