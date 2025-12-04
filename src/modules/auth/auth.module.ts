import { MiddlewareConsumer, Module } from '@nestjs/common';
import AuthenticationController from './auth.controller';
import { AuthenticationService } from './auth.service';
import { UserRepository, UserModel, OtpModel, RevokedTokenModel, RevokedTokenRepository } from 'src/db';
import OtpRepository from 'src/db/repositories/otp.repository';
import { IdService } from 'src/common';
import { JwtService } from '@nestjs/jwt';
import TokenService from 'src/common/utils/security/token.security';

@Module({
  imports: [UserModel, OtpModel, RevokedTokenModel],
  exports: [],
  controllers: [AuthenticationController],
  providers: [
    AuthenticationService,
    UserRepository,
    OtpRepository,
    RevokedTokenRepository,
    IdService,
    JwtService,
    TokenService,
  ],
})
class AuthenticationModule {
}

export default AuthenticationModule;
