import { Types } from 'mongoose';
import IUser from './user.interface';

class IBrand {
  id?: Types.ObjectId;

  name: string;
  slug: string;
  slogan: string;
  image: string;

  createdBy: Types.ObjectId | IUser;
  updatedBy?: Types.ObjectId | IUser;

  freezedAt?: Date;
  restoredAt?:  Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export default IBrand;
