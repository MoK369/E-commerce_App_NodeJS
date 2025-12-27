import { forwardRef, Module } from '@nestjs/common';
import {
  UserRepository,
  UserModel,
  RevokedTokenModel,
  RevokedTokenRepository,
  OtpRepository,
  OtpModel,
} from 'src/db';
import { IdService } from 'src/common';
import { JwtService } from '@nestjs/jwt';
import TokenService from 'src/common/services/security/token.security';

@Module({
  imports: [UserModel, RevokedTokenModel, OtpModel],
  exports: [
    UserModel,
    RevokedTokenModel,
    OtpModel,
    UserRepository,
    RevokedTokenRepository,
    OtpRepository,
    IdService,
    JwtService,
    TokenService,
  ],
  controllers: [],
  providers: [
    UserRepository,
    RevokedTokenRepository,
    OtpRepository,
    IdService,
    JwtService,
    TokenService,
  ],
})
class SharedAuthenticationModule {}

export default SharedAuthenticationModule;
