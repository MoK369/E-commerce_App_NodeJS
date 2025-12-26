import { IUser } from 'src/common';

export class LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: IUser;
}