import { Controller, Get, Post, Delete,  Body, Param, Res ,Req,UseGuards} from '@nestjs/common';
import { SessionService } from './sessions.service';
import type { Response, Request} from 'express';


import { JwtAuthGuard } from 'src/auth/guard/auth.guard';


interface AuthRequest extends Request {
  user?: any;
}





@UseGuards(JwtAuthGuard)


@Controller('sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Get()
@UseGuards(JwtAuthGuard)
async getSessions(@Req() req: AuthRequest) {
  const userId = req.user._id;
 

  return this.sessionService.getUserSessions(userId);
}


  @Post('logout-current')
  async logoutCurrent(@Req() req: AuthRequest, @Res({ passthrough: true }) res: Response) {
   
    const userId = req.user._id;
    const currentSessionId = req.user.sessionId;
    return this.sessionService.logoutCurrent(userId, currentSessionId, res);
  }

  


  



  @Delete('logout-selected')

  async logoutSelected(@Req() req: AuthRequest, @Body() body: { sessionIds: string[] }) {
    const userId = req.user._id;
    const currentSessionId = req.user.sessionId; // optional: you can pass if you want to protect current
    return this.sessionService.logoutSelectedDevices(userId, body.sessionIds, currentSessionId);
  }


  @Delete('logout-other-devices')
  async logoutOtherDevices(
    @Req() req: AuthRequest, 
    @Body() body: { userId: string }
  ) {
    const currentSessionId = req.user.sessionId; 
    return this.sessionService.logoutOtherDevices(body.userId, currentSessionId);
  }

 
  
}
