import { Types } from 'mongoose';
import { IUser } from './user.interface';
import IBrand from './brand.interface';

class ICategory {
  id?: Types.ObjectId;

  name: string;
  slug: string;
  description?: string;
  image: string;
  brands?: Types.ObjectId[] | IBrand[];
  assetFolderId: string;

  createdBy: Types.ObjectId | IUser;
  updatedBy?: Types.ObjectId | IUser;

  freezedAt?: Date;
  restoredAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export default ICategory;
