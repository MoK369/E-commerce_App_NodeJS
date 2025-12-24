import { MiddlewareConsumer, Module, NestModule, Scope } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import AuthenticationModule from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { resolve } from 'node:path';
import UserModule from './modules/user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { RouterModule } from '@nestjs/core';
import {
  IdService,
  S3KeyService,
  S3Service,
  setProtocolAndHostMiddleware,
} from './common';
import BrandModule from './modules/brand/brand.module';
import CategoryModule from './modules/category/category.module';
import ProductModule from './modules/product/product.module';
import CartModule from './modules/cart/cart.module';
import CouponModule from './modules/coupon/coupon.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: resolve('./config/.env.development'),
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.DB_URI!, {
      serverSelectionTimeoutMS: 15000,
    }),
    RouterModule.register([
      {
        path: 'api/v1',
        children: AppModule.modules,
      },
    ]),
    ...AppModule.modules,
  ],
  controllers: [AppController],
  providers: [AppService, S3Service, IdService, S3KeyService],
})
export class AppModule implements NestModule {
  static modules = [
    AuthenticationModule,
    UserModule,
    BrandModule,
    CategoryModule,
    ProductModule,
    CartModule,
    CouponModule,
  ];

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(setProtocolAndHostMiddleware)
      .forRoutes('api/v1', AppController);
  }
}
