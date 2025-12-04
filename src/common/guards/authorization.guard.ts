import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { UserRolesEnum } from '../enums';
import { Request } from 'express';
import { IAuthRequest } from '../interfaces';
import { Reflector } from '@nestjs/core';
import { StringConstants } from '../constants';

@Injectable()
class AuthorizationGuard implements CanActivate {
  constructor(private readonly _reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const accessRoles =
      this._reflector.getAllAndOverride<UserRolesEnum[]>(
        StringConstants.accessRolesName,
        [context.getHandler(), context.getClass()],
      ) ?? [];

    let req: any;
    let userRole: UserRolesEnum = UserRolesEnum.user;
    switch (context.getType()) {
      case 'http':
        const httpCtx = context.switchToHttp();
        req = httpCtx.getRequest<Request>();
        userRole =
          (req as IAuthRequest).credentials?.user.role ?? UserRolesEnum.user;
        break;

      default:
        break;
    }

    return accessRoles.includes(userRole);
  }
}

export default AuthorizationGuard;
