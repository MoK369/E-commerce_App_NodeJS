import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import TokenService from '../services/security/token.security';
import { Reflector } from '@nestjs/core';
import { TokenTypesEnum } from '../enums';
import { StringConstants } from '../constants';

@Injectable()
class AuthenticationGuard implements CanActivate {
  constructor(
    private readonly _tokenService: TokenService,
    private readonly _reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const tokenType =
      this._reflector.getAllAndOverride<TokenTypesEnum>(
        StringConstants.tokenTypeName,
        [context.getHandler(), context.getClass()],
      ) ?? TokenTypesEnum.access;

    let req: any;
    let authorization: string = '';
    switch (context.getType()) {
      case 'http':
        const httpCtx = context.switchToHttp();
        req = httpCtx.getRequest<Request>();
        authorization = req.headers.authorization ?? '';
        break;

      default:
        break;
    }

    const { user, payload } = await this._tokenService.decode({
      authorization,
      tokenType,
    });

    req.credentials = { user, payload };
    return true;
  }
}

export default AuthenticationGuard;
