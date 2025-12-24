import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WatchRequestInterceptor } from './common/interceptors';
import * as express from 'express';
import path from 'node:path';
import { useContainer } from 'class-validator';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  app.useGlobalInterceptors(new WatchRequestInterceptor());
  app.use('/uploads', express.static(path.resolve('./uploads')));
  await app.listen(process.env.PORT ?? 5000);
}
bootstrap();
