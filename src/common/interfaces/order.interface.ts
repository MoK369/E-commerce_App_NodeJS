import { Types } from 'mongoose';
import IUser from './user.interface';
import { OrderStatusEnum, PaymentTypesEnum } from '../enums';
import ICoupon from './coupon.interface';
import IProduct from './product.interface';

export class IOrderProduct {
  id?: Types.ObjectId;
  product: Types.ObjectId | IProduct;
  quantity: number;
  unitPrice: number;
  finalPrice: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export class IOrder {
  id?: Types.ObjectId;
  orderId: string;

  address: string;
  phone: string;
  note?: string;
  cancelReason?: string;

  status: OrderStatusEnum;
  payment: PaymentTypesEnum;

  coupon?: Types.ObjectId | ICoupon;
  discount?: number;
  total: number;
  subtotal: number;

  paidAt?: Date;
  paymentIntent?: string;

  products: IOrderProduct[];

  createdBy: Types.ObjectId | IUser;
  updatedBy?: Types.ObjectId | IUser;

  freezedAt?: Date;
  restoredAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}
