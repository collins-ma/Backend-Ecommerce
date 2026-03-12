import { Controller, Post, Body, HttpCode, Res, Req, Get,Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Response, Request } from 'express';
import { ForgotPasswordDto } from './Forgot-password.dto';
import { ResetPasswordDto } from './reset-password.dto';
import { Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './guard/auth.guard';
import { ChangePasswordDto } from './ChangePasswordDto.dto';

type requestObj={
  user:any
}
@Controller('auth')



export class AuthController {
  constructor(private readonly authService: AuthService) {}

 
  @Post('login')
  @HttpCode(200)
  async login(
    @Body() body: { username: string; password: string },
    @Req() req: Request,
    @Res({ passthrough: true }) response: Response
  ) {
    const user = await this.authService.validateUser(body.username, body.password);
    return this.authService.login(user, response,req); 
  }

  
  @Get('refresh')
  @HttpCode(200)
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    // Read refresh token from cookie
    const refreshToken = request.cookies?.jwt;

    
   

    return this.authService.refreshToken(refreshToken, response); 
    
  }

 

  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  async changePassword(@Req() req: requestObj, @Body() dto: ChangePasswordDto) {
    
    const userId=req.user._id
    console.log(userId)
    return this.authService.changePassword(userId, dto);
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto, @Query('token') token: string) {
    return this.authService.resetPassword(dto.password, token);
  }
}
