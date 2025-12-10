import { createParamDecorator, ExecutionContext } from '@nestjs/common';

const User = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    let req: any;
    switch (context.getType()) {
      case 'http':
        req = context.switchToHttp().getRequest();
        break;
      default:
        break;
    }
    return req.credentials.user;
  },
);

export default User;
