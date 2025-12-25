import { Types } from 'mongoose';
import IUser from './user.interface';
import { EmailEventsEnum } from '../enums';

interface IOtp {
  id?: Types.ObjectId;

  code: string;

  expiresAt: Date;

  createdBy: Types.ObjectId | IUser;

  type: EmailEventsEnum;

  count?: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export default IOtp;
