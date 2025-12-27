import { IUser } from 'src/common';

export class ProfileResponse {
  profile: IUser;
}

export class RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}
