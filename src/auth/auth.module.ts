import { Module,Global } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { SessionModule } from 'src/sessions/sessions.module';

@Global()

@Module({
  imports: [UsersModule,
    SessionModule,
    JwtModule.register({})
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService, JwtModule],
  
})
export class AuthModule {}
