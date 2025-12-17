import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { slugify } from 'node_modules/zod/v4/core/util.cjs';
import { IBrand, IUser } from 'src/common';

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
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

  @Prop({ type: MongooseSchema, required: true, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop({ type: MongooseSchema, ref: 'User' })
  updatedBy: Types.ObjectId;
}

export type HydratedBrand = HydratedDocument<Brand>;

export const brandSchema = SchemaFactory.createForClass(Brand);

brandSchema.virtual('id').get(function () {
  return this._id;
});

brandSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    console.log('inside pre save');

    this.slug = slugify(this.name);
  }
  next();
});

export const BrandModel = MongooseModule.forFeature([
  { name: Brand.name, schema: brandSchema },
]);
