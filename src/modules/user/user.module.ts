import { MiddlewareConsumer, Module } from '@nestjs/common';
import UserController from './user.controller';
import UserService from './user.service';
import {
  IdService,
  setDefaultLanguageMiddlware,
  TokenTypesEnum,
} from 'src/common';
import {
  OtpModel,
  OtpRepository,
  RevokedTokenModel,
  RevokedTokenRepository,
  UserModel,
  UserRepository,
} from 'src/db';
import {
  AuthenticationMiddleware,
  preAuthMiddleware,
} from 'src/common/middlewares/authentication.middleware';
import TokenService from 'src/common/utils/security/token.security';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [UserModel, OtpModel, RevokedTokenModel],
  exports: [],
  controllers: [UserController],
  providers: [
    UserService,
    UserRepository,
    OtpRepository,
    IdService,
    JwtService,
    RevokedTokenRepository,
    TokenService,
  ],
})
class UserModule {
  // configure(consumer: MiddlewareConsumer) {
  //   consumer
  //     .apply(
  //       setDefaultLanguageMiddlware,
  //       preAuthMiddleware({ tokenType: TokenTypesEnum.refresh }),
  //       AuthenticationMiddleware,
  //     )
  //     .forRoutes(UserController);
  // }
}

export default UserModule;
