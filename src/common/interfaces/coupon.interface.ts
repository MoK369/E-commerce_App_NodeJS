import { Types } from 'mongoose';
import IUser from './user.interface';
import { CouponTypesEnum } from '../enums';

class ICoupon {
  id?: Types.ObjectId;

  name: string;
  slug: string;
  image: string;

  createdBy: Types.ObjectId | IUser;
  updatedBy?: Types.ObjectId | IUser;
  usedBy?: Types.ObjectId[] | IUser[];

  duration: number;
  discount: number;
  type: CouponTypesEnum;

  startDate: Date;
  endDate: Date;

  freezedAt?: Date;
  restoredAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export default ICoupon;
