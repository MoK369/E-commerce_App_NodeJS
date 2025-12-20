import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  Default__v,
  HydratedDocument,
  Schema as MongooseSchema,
  Require_id,
  Types,
  UpdateQuery,
} from 'mongoose';
import { slugify } from 'node_modules/zod/v4/core/util.cjs';
import {
  IBrand,
  ICategory,
  IProduct,
  S3KeyService,
  softDeleteQueryFunction,
} from 'src/common';
import S3Module from 'src/common/modules/s3.module';

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  strictQuery: true,
  id: false,
})
export class Product implements IProduct {
  @Prop({ type: String, required: true, min: 2, max: 2000 })
  name: string;

  @Prop({ type: String, min: 2, max: 50 })
  slug: string;

  @Prop({ type: String, min: 5, max: 50_000 })
  description?: string;

  @Prop({ type: [String], required: true })
  images: string[];

  @Prop({ type: String, require: true })
  assetFolderId: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Category',
    required: true,
  })
  category: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Brand',
    required: true,
  })
  brand: Types.ObjectId;

  @Prop({ type: Number, required: true })
  originalPrice: number;
  @Prop({ type: Number, default: 0 })
  discountPercent: number;
  @Prop({ type: Number })
  salePrice: number;

  @Prop({ type: Number, required: true })
  stock: number;
  @Prop({ type: Number, default: 0 })
  soldItems: number;

  @Prop({ type: MongooseSchema, required: true, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop({ type: MongooseSchema, ref: 'User' })
  updatedBy: Types.ObjectId;

  @Prop({ type: Date })
  freezedAt?: Date;

  @Prop({ type: Date })
  restoredAt?: Date;
}

export type HydratedProduct = HydratedDocument<Product>;
export type FullProduct = Require_id<Default__v<Product>>;

export const productSchema = SchemaFactory.createForClass(Product);

productSchema.virtual('id').get(function () {
  return this._id;
});

productSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name);
  }

  if (this.isModified('originalPrice') || this.isModified('discountPercent')) {
    this.salePrice =
      this.originalPrice -
      this.originalPrice * ((this.discountPercent || 0) / 100);
  }
  next();
});

productSchema.pre(['updateOne', 'findOneAndUpdate'], function (next) {
  const update = this.getUpdate() as UpdateQuery<HydratedProduct>;
  if (update.name) {
    this.setUpdate({ ...update, slug: slugify(update.name) });
  }
  softDeleteQueryFunction(this);
  next();
});

productSchema.pre(['find', 'findOne', 'countDocuments'], function (next) {
  softDeleteQueryFunction(this);
  next();
});

export const ProductModel = MongooseModule.forFeatureAsync([
  {
    name: Product.name,
    imports: [S3Module],
    useFactory: function (s3KeyService: S3KeyService) {
      productSchema.methods.toJSON = function () {
        const { _id, ...restObj } = this.toObject() as FullProduct;

        // if(restObj.createdBy && typeof restObj.createdBy == "object" ){

        // }

        if (restObj.images?.length) {
          restObj.images = restObj.images.map((image) =>
            s3KeyService.generateS3UploadsUrlFromSubKey({
              req: { host: process.env.HOST!, protocol: process.env.PROTOCOL! },
              subKey: image,
            }),
          );
        }
        return {
          id: _id,
          name: restObj.name,
          description: restObj.description,
          image: restObj.images,
          originalPrice: restObj.originalPrice,
          discountPercent: restObj.discountPercent,
          salePrice: restObj.salePrice,
          category: restObj.category,
          brand: restObj.brand,
          __v: restObj.__v,
        };
      };

      return productSchema;
    },
    inject: [S3KeyService],
  },
]);

