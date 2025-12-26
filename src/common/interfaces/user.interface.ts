import { Types } from 'mongoose';
import {
  GenderEnum,
  LanguagesEnum,
  ProvidersEnum,
  UserRolesEnum,
} from '../enums';
import { HydratedOtp } from 'src/db';
import IProduct from './product.interface';

export interface IUser {
  id?: Types.ObjectId;

  firstName: string;

  lastName: string;

  username?: string;

  email: string;

  password?: string;

  provider: ProvidersEnum;

  gender: GenderEnum;

  preferedLanguage: LanguagesEnum;

  role: UserRolesEnum;

  confirmedAt?: Date;

  changeCredentialsTime?: Date;

  profileImage?: IProfileImage;

  otps: HydratedOtp[];

  lastResetPasswordAt: Date;
  resetPasswordVerificationExpiresAt: Date;

  wishlist?: Types.ObjectId[] | IProduct[];

  createdAt?: Date;
  updatedAt?: Date;
}

export interface IProfileImage {
  url: string;
  provider: ProvidersEnum;
}
