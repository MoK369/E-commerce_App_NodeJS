import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WatchRequestInterceptor } from './common/interceptors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new WatchRequestInterceptor());
  
  await app.listen(process.env.PORT ?? 5000);
}
bootstrap();
