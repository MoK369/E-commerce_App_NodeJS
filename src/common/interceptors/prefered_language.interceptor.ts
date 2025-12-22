import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { IAuthRequest } from '../interfaces';

class PreferedLanguageInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const req: IAuthRequest = context.switchToHttp().getRequest();
    req.headers['accept-language'] =
      req.headers['accept-language'] ?? req.credentials?.user.preferedLanguage;

    return next.handle();
  }
}

export default PreferedLanguageInterceptor;
