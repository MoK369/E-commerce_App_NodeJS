import { forwardRef, Module } from '@nestjs/common';
import {
  UserRepository,
  UserModel,
  RevokedTokenModel,
  RevokedTokenRepository,
} from 'src/db';
import { IdService } from 'src/common';
import { JwtService } from '@nestjs/jwt';
import TokenService from 'src/common/services/security/token.security';

@Module({
  imports: [UserModel, RevokedTokenModel],
  exports: [
    UserModel,
    RevokedTokenModel,
    UserRepository,
    RevokedTokenRepository,
    IdService,
    JwtService,
    TokenService,
  ],
  controllers: [],
  providers: [
    UserRepository,
    RevokedTokenRepository,
    IdService,
    JwtService,
    TokenService,
  ],
})
class SharedAuthenticationModule {}

export default SharedAuthenticationModule;
