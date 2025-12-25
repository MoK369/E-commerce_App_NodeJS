import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  Default__v,
  HydratedDocument,
  Schema as MongooseSchema,
  Require_id,
  Types,
  UpdateQuery,
  UpdateWithAggregationPipeline,
} from 'mongoose';
import { slugify } from 'node_modules/zod/v4/core/util.cjs';
import { ICategory, S3KeyService, softDeleteQueryFunction } from 'src/common';
import S3Module from 'src/common/modules/s3.module';

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  strictQuery: true,
  strict: true,
  id: false,
})
export class Category implements ICategory {
  @Prop({ type: String, unique: true, required: true, min: 2, max: 50 })
  name: string;

  @Prop({ type: String, min: 2, max: 50 })
  slug: string;

  @Prop({ type: String, required: true, min: 5, max: 5_000 })
  description: string;

  @Prop({ type: String, required: true })
  image: string;

  @Prop({ type: [Types.ObjectId], ref: 'Brand' })
  brands?: Types.ObjectId[];

  @Prop({ type: String, required: true })
  assetFolderId: string;

  @Prop({ type: MongooseSchema, required: true, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop({ type: MongooseSchema, ref: 'User' })
  updatedBy: Types.ObjectId;

  @Prop({ type: Date })
  freezedAt?: Date;

  @Prop({ type: Date })
  restoredAt?: Date;
}

export type HydratedCategory = HydratedDocument<Category>;
export type FullCategory = Require_id<Default__v<Category>>;

export const categorySchema = SchemaFactory.createForClass(Category);

categorySchema.virtual('id').get(function () {
  return this._id;
});

categorySchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name);
  }
  next();
});

categorySchema.pre(['updateOne', 'findOneAndUpdate'], function (next) {
  const update:
    | UpdateQuery<HydratedCategory>
    | UpdateWithAggregationPipeline
    | null = this.getUpdate();
  if (Array.isArray(update)) {
    const name: string | undefined = update![0]['$set'].name;
    if (name) {
      update![0]['$set'].slug = slugify(name);
      this.setUpdate(update);
    }
  } else if (typeof update == 'object') {
    if ((update as UpdateQuery<HydratedCategory>)?.name) {
      this.setUpdate({
        ...update,
        slug: slugify((update as UpdateQuery<HydratedCategory>).name),
      });
    }
  }
  softDeleteQueryFunction(this);
  next();
});

categorySchema.pre(['find', 'findOne', 'countDocuments'], function (next) {
  softDeleteQueryFunction(this);
  next();
});

export const CategoryModel = MongooseModule.forFeatureAsync([
  {
    name: Category.name,
    imports: [S3Module],
    useFactory: function (s3KeyService: S3KeyService) {
      categorySchema.methods.toJSON = function () {
        const { _id, ...restObj } = this.toObject() as FullCategory;

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

      return categorySchema;
    },
    inject: [S3KeyService],
  },
]);
