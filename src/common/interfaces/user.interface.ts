import { Types } from 'mongoose';
import {
  GenderEnum,
  LanguagesEnum,
  ProvidersEnum,
  UserRolesEnum,
} from '../enums';
import { HydratedOtp } from 'src/db';

interface IUser {
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

  profileImage?: { url: string; provider: ProvidersEnum };

  otps: HydratedOtp[];

  createdAt?: Date;
  updatedAt?: Date;
}

export default IUser;
