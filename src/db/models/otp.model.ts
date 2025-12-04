import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from './user.model';
import { emailEvent, EmailEventsEnum, HashingUtil } from 'src/common';

@Schema({ timestamps: true })
export class Otp {
  @Prop({ type: String, required: true })
  code: string;

  @Prop({ type: Date, required: true })
  expiresAt: Date;

  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
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
  console.log({ that, wasNew: that.wasNew, plainOtp: that.plainOtp });
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

export const OtpModel = MongooseModule.forFeature([
  { name: Otp.name, schema: otpSchema },
]);
