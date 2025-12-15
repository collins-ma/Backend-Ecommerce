import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Session } from './session.schema';
import type { Response } from 'express';

@Injectable()
export class SessionService {
  constructor(@InjectModel(Session.name) private readonly sessionModel: Model<Session>) {}

  async createSession(data: {
    sessionId: string;
    userId: string;
    refreshToken: string;
    userAgent?: string;
    ipAddress?: string;
    expiresAt: Date;
  }) {
    return this.sessionModel.create(data);
  }

  // Get all sessions for a user
  async getUserSessions(userId: string) {
    return this.sessionModel.find({ userId })
      .select('sessionId userAgent ipAddress createdAt expiresAt')
      .sort({ createdAt: -1 });
  }

  async findSession(sessionId: string) {
    return this.sessionModel.findOne({ sessionId });
  }

  // Logout current device
  async logoutCurrent( userId:string,  sessionId: string, res: Response) {
    await this.sessionModel.deleteOne({ sessionId , userId });

    res.clearCookie('jwt', { httpOnly: true, secure: true, sameSite: 'none' });
    return { message: 'Logged out from current device' };
  }

  // Logout other devices
  async logoutOtherDevices(userId: string, currentSessionId: string) {
    await this.sessionModel.deleteMany({ userId, sessionId: { $ne: currentSessionId } });
    return { message: 'Logged out from other devices' };
  }

  async logoutSelectedDevices(userId: string, sessionIds: string[], currentSessionId?: string) {
    // optional: prevent deleting current session
    const filteredSessionIds = sessionIds.filter(id => id !== currentSessionId);

    await this.sessionModel.deleteMany({
      userId,
      sessionId: { $in: filteredSessionIds },
    });

    return { message: 'Selected devices logged out' };
  }

  

 
}
