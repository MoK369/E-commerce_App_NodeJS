import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { IAuthRequest } from '../interfaces';

class RequestContextInterceptor implements NestInterceptor {
  constructor(private _idFieldName: string) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const req: IAuthRequest = context.switchToHttp().getRequest();
    if (req.body) {
      req.body.requestContext = {
        id: `${req.params[this._idFieldName]}`,
      };
    }
    
    return next.handle();
  }
}

export default RequestContextInterceptor;
