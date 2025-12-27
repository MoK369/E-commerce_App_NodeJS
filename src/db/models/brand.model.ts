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
import { IBrand, S3KeyService, softDeleteQueryFunction } from 'src/common';
import S3Module from 'src/common/modules/s3.module';

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  strictQuery: true,
  id: false,
})
export class Brand implements IBrand {
  @Prop({ type: String, unique: true, required: true, min: 2, max: 50 })
  name: string;

  @Prop({ type: String, min: 2, max: 50 })
  slug: string;

  @Prop({ type: String, required: true, min: 2, max: 50 })
  slogan: string;

  @Prop({ type: String, required: true })
  image: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  updatedBy: Types.ObjectId;

  @Prop({ type: Date })
  freezedAt?: Date;

  @Prop({ type: Date })
  restoredAt?: Date;
}

export type HydratedBrand = HydratedDocument<Brand>;
export type FullBrand = Require_id<Default__v<Brand>>;

export const brandSchema = SchemaFactory.createForClass(Brand);

brandSchema.virtual('id').get(function () {
  return this._id;
});

brandSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name);
  }
  next();
});

brandSchema.pre(['updateOne', 'findOneAndUpdate'], function (next) {
  const update = this.getUpdate() as UpdateQuery<HydratedBrand>;
  if (update.name) {
    this.setUpdate({ ...update, slug: slugify(update.name) });
  }
  softDeleteQueryFunction(this);  
  next();
});

brandSchema.pre(['find', 'findOne', 'countDocuments'], function (next) {
  softDeleteQueryFunction(this);
  next();
});

export const BrandModel = MongooseModule.forFeatureAsync([
  {
    name: Brand.name,
    imports: [S3Module],
    useFactory: function (s3KeyService: S3KeyService) {
      brandSchema.methods.toJSON = function () {
        const { _id, ...restObj } = this.toObject() as FullBrand;

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

      return brandSchema;
    },
    inject: [S3KeyService],
  },
]);
