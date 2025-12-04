import { Request } from 'express';
import type { JwtPayload } from 'jsonwebtoken';
import { HydratedUser } from 'src/db';
import { TokenTypesEnum } from '../enums';

export interface ITokenPayload extends JwtPayload {
  sub: string;
  jti: string;
}

export interface ICredentials {
  user: HydratedUser;
  payload: ITokenPayload;
}

export interface IAuthRequest extends Request {
  credentials?: ICredentials;
  tokenType?: TokenTypesEnum;
}
