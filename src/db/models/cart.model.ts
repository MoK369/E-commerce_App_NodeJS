import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  Default__v,
  HydratedDocument,
  Schema as MongooseSchema,
  Require_id,
  Types,
} from 'mongoose';
import { ICart, ICartProduct, IProduct, S3KeyService } from 'src/common';
import S3Module from 'src/common/modules/s3.module';
import { FullProduct } from './product.model';

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  strictQuery: true,
  id: false,
})
export class CartProduct implements ICartProduct {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, ref: 'Product' })
  product: Types.ObjectId | IProduct;

  @Prop({ type: Number, required: true, min: 1, max: 500 })
  quantity: number;
}

export type HydratedCartProduct = HydratedDocument<ICartProduct>;
export type FullCartProduct = Require_id<Default__v<ICartProduct>>;

export const cartProductSchema = SchemaFactory.createForClass(CartProduct);

cartProductSchema.virtual('id').get(function () {
  return this._id;
});

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  strictQuery: true,
  id: false,
})
export class Cart implements ICart {
  @Prop({ type: MongooseSchema, unique: true, required: true, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop({ type: [CartProduct] })
  products: ICartProduct[];
}

export type HydratedCart = HydratedDocument<Cart>;
export type FullCart = Require_id<Default__v<Cart>>;

export const cartSchema = SchemaFactory.createForClass(Cart);

cartSchema.virtual('id').get(function () {
  return this._id;
});

export const CartModel = MongooseModule.forFeatureAsync([
  {
    name: Cart.name,
    imports: [S3Module],
    useFactory: function (s3KeyService: S3KeyService) {
      cartProductSchema.methods.toJSON = function () {
        return cartProductJson(
          this.toObject() as FullCartProduct,
          s3KeyService,
        );
      };

      cartSchema.methods.toJSON = function () {
        const { _id, ...restObj } = this.toObject() as FullCart;

        // if(restObj.createdBy && typeof restObj.createdBy == "object" ){

        // }
        restObj.products = restObj?.products.map((p) =>
          cartProductJson(p as FullCartProduct, s3KeyService),
        );
        return { id: _id, ...restObj };
      };

      return cartSchema;
    },
    inject: [S3KeyService],
  },
]);

function cartProductJson(
  cartProduct: FullCartProduct,
  s3KeyService: S3KeyService,
) {
  if (
    typeof cartProduct.product == 'object' &&
    (cartProduct.product as any)._bsontype?.toLowerCase() !== 'objectid'
  ) {
    const { _id, ...restObj } = cartProduct.product as FullProduct;
    if (restObj?.images?.length)
      restObj.images = restObj.images.map((image) =>
        s3KeyService.generateS3UploadsUrlFromSubKey({
          req: { host: process.env.HOST!, protocol: process.env.PROTOCOL! },
          subKey: image,
        }),
      );
    cartProduct.product = { id: _id, ...restObj };
  }

  return {
    id: cartProduct._id,
    product: cartProduct.product,
    quantity: cartProduct.quantity,
    createdAt: cartProduct?.createdAt,
    updatedAt: cartProduct?.updatedAt,
  };
}
