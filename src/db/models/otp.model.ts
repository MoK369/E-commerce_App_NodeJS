import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  HydratedDocument,
  Types,
  Schema as MongooseSchema,
  Query,
} from 'mongoose';
import { User } from './user.model';
import { emailEvent, EmailEventsEnum, HashingUtil, IOtp } from 'src/common';
import { OtpRepository } from '../repositories';
import { ModuleRef } from '@nestjs/core';

@Schema({ timestamps: true })
export class Otp implements IOtp {
  @Prop({ type: String, required: true })
  code: string;

  @Prop({ type: Date, required: true })
  expiresAt: Date;

  @Prop({ type: Number, default: 0 })
  count: number;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(EmailEventsEnum),
    required: true,
  })
  type: EmailEventsEnum;
}

export type HydratedOtp = HydratedDocument<Otp>;

export const otpSchema = SchemaFactory.createForClass(Otp);
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

otpSchema.virtual('id').get(function () {
  return this._id;
});

otpSchema.pre(
  'save',
  async function (
    this: HydratedOtp & { wasNew: boolean; plainOtp: string },
    next,
  ) {
    this.wasNew = this.isNew;
    if (this.isModified('code') && !HashingUtil.isHashed({ text: this.code })) {
      this.plainOtp = this.code;
      this.code = await HashingUtil.generateHash({ plainText: this.code });
      await this.populate([{ path: 'createdBy', select: 'email' }]);
    }
    next();
  },
);

otpSchema.post('save', function (doc, next) {
  const that = this as HydratedOtp & { wasNew: boolean; plainOtp: string };
  console.log({ type: that.type });

  if (that.wasNew && that.plainOtp) {
    emailEvent.publish({
      eventName: that.type,
      payload: {
        to: (that.createdBy as unknown as User).email,
        otp: that.plainOtp,
      },
    });
  }
  next();
});

otpSchema.pre(['updateOne', 'findOneAndUpdate'], async function (next) {
  const update = this.getUpdate() as Partial<IOtp>;
  if (update.code && !HashingUtil.isHashed({ text: update.code })) {
    this.$locals ??= {};
    this.$locals.plainOtp = update.code;
    update.code = await HashingUtil.generateHash({ plainText: update.code });
  }
  this.setUpdate(update);
  next();
});

export const OtpModel = MongooseModule.forFeatureAsync([
  {
    name: Otp.name,
    inject: [ModuleRef],
    useFactory: function (moduleRef: ModuleRef) {
      otpSchema.post(
        ['updateOne', 'findOneAndUpdate'],
        async function (this, doc, next) {
          const otp = await moduleRef
            .get(OtpRepository, {
              strict: false,
            })
            .findOne({
              filter: this.getFilter(),
              options: {
                projection: { type: 1, createdBy: 1 },
                populate: [{ path: 'createdBy', select: 'email' }],
              },
            });

          if (otp && this.$locals.plainOtp) {
            emailEvent.publish({
              eventName: otp.type,
              payload: {
                to: (otp.createdBy as unknown as User).email,
                otp: this.$locals.plainOtp as string,
              },
            });
          }

          next();
        },
      );
      return otpSchema;
    },
  },
]);
