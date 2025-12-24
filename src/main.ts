import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WatchRequestInterceptor } from './common/interceptors';
import * as express from 'express';
import path from 'node:path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalInterceptors(new WatchRequestInterceptor());
  app.use('/uploads', express.static(path.resolve('./uploads')));
  await app.listen(process.env.PORT ?? 5000);
}
bootstrap();
