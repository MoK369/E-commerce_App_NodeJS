import { Types } from 'mongoose';
import { IUser } from './user.interface';
import IProduct from './product.interface';

export class ICartProduct {
  id?: Types.ObjectId;

  product: Types.ObjectId | IProduct;
  quantity: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export class ICart {
  id?: Types.ObjectId;

  createdBy: Types.ObjectId | IUser;
  products: ICartProduct[];

  createdAt?: Date;
  updatedAt?: Date;
}
