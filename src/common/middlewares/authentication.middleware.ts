import {
  BadRequestException,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import type { NextFunction, Response } from 'express';
import TokenService from '../utils/security/token.security';
import type { IAuthRequest } from '../interfaces';
import { TokenTypesEnum } from '../enums';
//   {
//   tokenType = TokenTypesEnum.access,
// }: {
//   tokenType?: TokenTypesEnum;
// } = {}
export const preAuthMiddleware = () => {
  return (req: IAuthRequest, res: Response, next: NextFunction) => {    
    if (
      !req.headers.authorization?.split(' ')?.length ||
      req.headers.authorization.split(' ').length != 2
    ) {
      throw new BadRequestException('Missing Authorization key 🔐');
    }
    //req.tokenType = tokenType;
    next();
  };
};

@Injectable()
export class AuthenticationMiddleware implements NestMiddleware {
  constructor(private _tokenService: TokenService) {}

  async use(req: IAuthRequest, res: Response, next: NextFunction) {
    const { user, payload } = await this._tokenService.decode({
      authorization: req.headers.authorization ?? '',
      tokenType: req.tokenType,
    });

    req.credentials = { user, payload };
    next();
  }
}
