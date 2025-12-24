import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  Default__v,
  HydratedDocument,
  Schema as MongooseSchema,
  Require_id,
  Types,
} from 'mongoose';
import {
  ICoupon,
  IOrder,
  IOrderProduct,
  IProduct,
  OrderStatusEnum,
  PaymentTypesEnum,
  S3KeyService,
  softDeleteQueryFunction,
} from 'src/common';
import S3Module from 'src/common/modules/s3.module';
import { FullProduct } from './product.model';

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  strictQuery: true,
  id: false,
})
class OrderProduct implements IOrderProduct {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true })
  product: Types.ObjectId | IProduct;

  @Prop({ type: Number, required: true })
  quantity: number;

  @Prop({ type: Number, required: true })
  unitPrice: number;

  @Prop({ type: Number, required: true })
  finalPrice: number;
}

export type HydratedOrderProduct = HydratedDocument<IOrderProduct>;
export type FullOrderProduct = Require_id<Default__v<IOrderProduct>>;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  strictQuery: true,
  id: false,
})
export class Order implements IOrder {
  @Prop({ type: String, unique: true, required: true })
  orderId: string;

  @Prop({ type: String, required: true, minLength: 5, maxLength: 1000 })
  address: string;

  @Prop({ type: String, required: true })
  phone: string;

  @Prop({ type: String, minLength: 2, maxLength: 500 })
  note?: string;

  @Prop({ type: String })
  cancelReason?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Coupon' })
  coupon?: Types.ObjectId | ICoupon;

  @Prop({ type: Number, default: 0 })
  discount: number;

  @Prop({ type: Number, required: true })
  total: number;

  @Prop({ type: Number })
  subtotal: number;

  @Prop({ type: Date })
  paidAt?: Date;

  @Prop({
    type: String,
    enum: Object.values(PaymentTypesEnum),
    default: PaymentTypesEnum.cash,
  })
  payment: PaymentTypesEnum;

  @Prop({ type: String })
  paymentIntent?: string;

  @Prop({
    type: String,
    enum: Object.values(OrderStatusEnum),
    default: function (this: Order) {
      return this.payment == PaymentTypesEnum.card
        ? OrderStatusEnum.pending
        : OrderStatusEnum.placed;
    },
  })
  status: OrderStatusEnum;
  

  @Prop({ type: [OrderProduct] })
  products: IOrderProduct[];

  @Prop({ type: MongooseSchema, required: true, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop({ type: MongooseSchema, ref: 'User' })
  updatedBy: Types.ObjectId;

  @Prop({ type: Date })
  freezedAt?: Date;

  @Prop({ type: Date })
  restoredAt?: Date;
}

export type HydratedOrder = HydratedDocument<Order>;
export type FullOrder = Require_id<Default__v<Order>>;

export const orderSchema = SchemaFactory.createForClass(Order);

orderSchema.virtual('id').get(function () {
  return this._id;
});

orderSchema.pre('save', async function (next) {
  if (this.isModified('total')) {
    this.subtotal = this.total - this.total * (this.discount / 100);
  }
});

orderSchema.pre(['updateOne', 'findOneAndUpdate'], function (next) {
  softDeleteQueryFunction(this);
  next();
});

orderSchema.pre(['find', 'findOne', 'countDocuments'], function (next) {
  softDeleteQueryFunction(this);
  next();
});

export const OrderModel = MongooseModule.forFeatureAsync([
  {
    name: Order.name,
    imports: [S3Module],
    useFactory: function (s3KeyService: S3KeyService) {
      orderSchema.methods.toJSON = function () {
        const { _id, ...restObj } = this.toObject() as FullOrder;

        // if(restObj.createdBy && typeof restObj.createdBy == "object" ){

        // }

        restObj.products = restObj?.products.map((p) =>
          orderProductJson(p as FullOrderProduct, s3KeyService),
        );
        return { id: _id, ...restObj };
      };

      return orderSchema;
    },
    inject: [S3KeyService],
  },
]);

function orderProductJson(
  orderProduct: FullOrderProduct,
  s3KeyService: S3KeyService,
): IOrderProduct {
  if (
    typeof orderProduct.product == 'object' &&
    (orderProduct.product as any)._bsontype?.toLowerCase() !== 'objectid'
  ) {
    const { _id, ...restObj } = orderProduct.product as FullProduct;
    if (restObj?.images?.length)
      restObj.images = restObj.images.map((image) =>
        s3KeyService.generateS3UploadsUrlFromSubKey({
          req: { host: process.env.HOST!, protocol: process.env.PROTOCOL! },
          subKey: image,
        }),
      );
    orderProduct.product = { id: _id, ...restObj };
  }

  return {
    id: orderProduct._id,
    product: orderProduct.product,
    quantity: orderProduct.quantity,
    unitPrice: orderProduct.unitPrice,
    finalPrice: orderProduct.finalPrice,
    createdAt: orderProduct?.createdAt,
    updatedAt: orderProduct?.updatedAt,
  };
}
