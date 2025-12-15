import { Controller, Post, Body, HttpCode, Res, Req, Get,Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Response, Request } from 'express';
import { ForgotPasswordDto } from './Forgot-password.dto';
import { ResetPasswordDto } from './reset-password.dto';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ------------------- LOGIN -------------------
  @Post('login')
  @HttpCode(200)
  async login(
    @Body() body: { username: string; password: string },
    @Req() req: Request,
    @Res({ passthrough: true }) response: Response
  ) {
    const user = await this.authService.validateUser(body.username, body.password);
    return this.authService.login(user, response,req); // sets cookie + returns access token
  }

  // ------------------- REFRESH -------------------
  @Get('refresh')
  @HttpCode(200)
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    // Read refresh token from cookie
    const refreshToken = request.cookies?.jwt;

    
   

    return this.authService.refreshToken(refreshToken, response); 
    // refresh service will handle expired, invalid, or missing tokens
  }

  // ------------------- LOGOUT -------------------
  // @Post('logout')
  // @HttpCode(200)
  // async logout(@Res({ passthrough: true }) response: Response,   @Req() req: Request) {

  //   const sessionId = req.headers['x-session-id'] as string;
  //   return this.authService.logout(sessionId, response);
  // }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto, @Query('token') token: string) {
    return this.authService.resetPassword(dto.password, token);
  }
}
