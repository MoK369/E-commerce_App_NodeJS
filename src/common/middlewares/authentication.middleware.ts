import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import TokenService from '../utils/security/token.security';
import type { IAuthRequest } from '../interfaces';
import { TokenTypesEnum } from '../enums';

export const preAuthMiddleware = ({
  tokenType = TokenTypesEnum.access,
}: {
  tokenType?: TokenTypesEnum;
} = {}) => {
  return (req: IAuthRequest, res: Response, next: NextFunction) => {
    req.tokenType = tokenType;
    next();
  };
};

@Injectable()
export class AuthenticationMiddleware implements NestMiddleware {
  constructor(private _tokenService: TokenService) {}

  async use(req: IAuthRequest, res: Response, next: NextFunction) {
    console.log('Authenctiation Middlware');

    const { user, payload } = await this._tokenService.decode({
      authorization: req.headers.authorization ?? '',
      tokenType: req.tokenType,
    });

    req.credentials = { user, payload };
    next();
  }
}
