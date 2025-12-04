import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import AuthenticationModule from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { resolve } from 'node:path';
import UserModule from './modules/user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { RouterModule } from '@nestjs/core';

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
        children: [AuthenticationModule, UserModule],
      },
    ]),
    AuthenticationModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
