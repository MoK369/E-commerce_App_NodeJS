import { createParamDecorator, ExecutionContext } from '@nestjs/common';

const TokenPayload = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    let req: any;
    switch (context.getType()) {
      case 'http':
        req = context.switchToHttp().getRequest();
        break;
      default:
        break;
    }
    return req.credentials.payload;
  },
);

export default TokenPayload;
