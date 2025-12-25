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
  CouponTypesEnum,
  ICoupon,
  IUser,
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
export class Coupon implements ICoupon {
  @Prop({ type: String, unique: true, required: true, min: 2, max: 50 })
  name: string;

  @Prop({ type: String, min: 2, max: 50 })
  slug: string;

  @Prop({ type: String, required: true })
  image: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  updatedBy: Types.ObjectId;

  @Prop({ type: [MongooseSchema.Types.ObjectId], ref: 'User' })
  usedBy: Types.ObjectId[] | IUser[];

  @Prop({ type: Date, required: true })
  startDate: Date;
  @Prop({ type: Date, required: true })
  endDate: Date;

  @Prop({ type: Number, required: true })
  discount: number;
  @Prop({ type: Number, default: 1 })
  duration: number;
  @Prop({
    type: String,
    enum: Object.values(CouponTypesEnum),
    default: CouponTypesEnum.Percent,
  })
  type: CouponTypesEnum;

  @Prop({ type: Date })
  freezedAt?: Date;

  @Prop({ type: Date })
  restoredAt?: Date;
}

export type HydratedCoupon = HydratedDocument<Coupon>;
export type FullCoupon = Require_id<Default__v<Coupon>>;

export const couponSchema = SchemaFactory.createForClass(Coupon);

couponSchema.virtual('id').get(function () {
  return this._id;
});

couponSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name);
  }
  next();
});

couponSchema.pre(['updateOne', 'findOneAndUpdate'], function (next) {
  const update = this.getUpdate() as UpdateQuery<HydratedCoupon>;
  if (update.name) {
    this.setUpdate({ ...update, slug: slugify(update.name) });
  }
  softDeleteQueryFunction(this);
  next();
});

couponSchema.pre(['find', 'findOne', 'countDocuments'], function (next) {
  softDeleteQueryFunction(this);
  next();
});

export const CouponModel = MongooseModule.forFeatureAsync([
  {
    name: Coupon.name,
    imports: [S3Module],
    useFactory: function (s3KeyService: S3KeyService) {
      couponSchema.methods.toJSON = function () {
        const { _id, ...restObj } = this.toObject() as FullCoupon;

        // if(restObj.createdBy && typeof restObj.createdBy == "object" ){

        // }

        if (restObj.image) {
          restObj.image = s3KeyService.generateS3UploadsUrlFromSubKey({
            req: { host: process.env.HOST!, protocol: process.env.PROTOCOL! },
            subKey: restObj.image,
          });
        }
        return { id: _id, ...restObj };
      };

      return couponSchema;
    },
    inject: [S3KeyService],
  },
]);
