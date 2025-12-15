import { Module } from '@nestjs/common';
import { Session, SessionSchema } from './session.schema'
import { MongooseModule } from '@nestjs/mongoose';
import { SessionService } from './sessions.service';
import { SessionController } from './sessions.controller';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: Session.name, schema: SessionSchema }])
  ],
  providers: [SessionService],
  controllers: [SessionController],
  exports: [SessionService], // so AuthService can use it
})
export class SessionModule {}
