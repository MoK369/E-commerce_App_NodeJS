import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import UserController from './user.controller';
import UserService from './user.service';
import { preAuthMiddleware } from 'src/common/middlewares/authentication.middleware';
import { SharedAuthenticationModule } from 'src/common/modules';
import { S3KeyService, S3Service } from 'src/common';

@Module({
  imports: [
    SharedAuthenticationModule,
    // MulterModule.register({
    //   storage: diskStorage({
    //     destination(req, file, callback) {
    //       callback(null, './uploads');
    //     },
    //     filename(req, file, callback) {
    //       const idService = new IdService();
    //       callback(
    //         null,
    //         `${idService.generateAlphaNumaricId()}_${file.originalname}`,
    //       );
    //     },
    //   }),
    // }),
  ],
  exports: [],
  controllers: [UserController],
  providers: [UserService, S3Service, S3KeyService],
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
