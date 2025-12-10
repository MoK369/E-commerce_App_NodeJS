import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import UserController from './user.controller';
import UserService from './user.service';
import { preAuthMiddleware } from 'src/common/middlewares/authentication.middleware';
import { SharedAuthenticationModule } from 'src/common/modules';

@Module({
  imports: [SharedAuthenticationModule],
  exports: [],
  controllers: [UserController],
  providers: [UserService],
})
class UserModule implements NestModule {
  // configure(consumer: MiddlewareConsumer) {
  //   consumer
  //     .apply(
  //       setDefaultLanguageMiddlware,
  //       preAuthMiddleware({ tokenType: TokenTypesEnum.refresh }),
  //       AuthenticationMiddleware,
  //     )
  //     .forRoutes(UserController);
  // }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(preAuthMiddleware()).forRoutes(UserController);
  }
}

export default UserModule;
