import {
  MongooseModule,
  Prop,
  Schema,
  SchemaFactory,
  Virtual,
} from '@nestjs/mongoose';
import { Schema as MongooseSchema, HydratedDocument, Types } from 'mongoose';
import {
  GenderEnum,
  HashingUtil,
  IProduct,
  IUser,
  LanguagesEnum,
  ProvidersEnum,
  UserRolesEnum,
} from 'src/common';
import { HydratedOtp } from './otp.model';

@Schema({
  strictQuery: true,
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class User implements IUser {
  @Prop({
    type: String,
    required: true,
    minLength: 2,
    maxLength: 25,
    trim: true,
  })
  firstName: string;

  @Prop({
    type: String,
    required: true,
    minLength: 2,
    maxLength: 25,
    trim: true,
  })
  lastName: string;

  @Virtual({
    get: function (this: User) {
      return `${this.firstName} ${this.lastName}`;
    },
    set: function (value: string) {
      const [firstName, lastName] = value.split(' ') || [];
      this.firstName = firstName;
      this.lastName = lastName;
    },
  })
  username: string;

  @Prop({ type: String, required: true, unique: true })
  email: string;

  @Prop({
    type: String,
    required: function (this: User) {
      return this.provider === ProvidersEnum.local;
    },
  })
  password: string;

  @Prop({
    type: String,
    enum: Object.values(ProvidersEnum),
    default: ProvidersEnum.local,
  })
  provider: ProvidersEnum;

  @Prop({
    type: String,
    enum: Object.values(GenderEnum),
    default: GenderEnum.male,
  })
  gender: GenderEnum;

  @Prop({
    type: String,
    enum: Object.values(LanguagesEnum),
    default: LanguagesEnum.EN,
  })
  preferedLanguage: LanguagesEnum;

  @Prop({
    type: String,
    enum: Object.values(UserRolesEnum),
    default: UserRolesEnum.user,
  })
  role: UserRolesEnum;

  @Prop({ type: Date })
  confirmedAt: Date;

  @Prop({ type: Date })
  changeCredentialsTime: Date;

  @Prop({
    type: {
      url: String,
      provider: {
        type: String,
        enum: Object.values(ProvidersEnum),
      },
    },
  })
  profileImage: { url: string; provider: ProvidersEnum };

  @Virtual()
  otps: HydratedOtp[];

  @Prop({ type: Date })
  lastResetPasswordAt: Date;

  @Prop({ type: Date })
  resetPasswordVerificationExpiresAt: Date;

  @Prop({ type: [MongooseSchema.Types.ObjectId], ref: 'Product', max: 500 })
  wishlist?: Types.ObjectId[] | IProduct[];
}

export type HydratedUser = HydratedDocument<User>;

export const userSchema = SchemaFactory.createForClass(User);

userSchema.virtual('otps', {
  localField: '_id',
  foreignField: 'createdBy',
  ref: 'Otp',
});

userSchema.virtual('id').get(function () {
  return this._id;
});

export const UserModel = MongooseModule.forFeatureAsync([
  {
    name: User.name,
    useFactory: function () {
      userSchema.pre('save', async function () {
        if (
          this.isModified('password') &&
          !HashingUtil.isHashed({ text: this.password })
        ) {
          this.password = await HashingUtil.generateHash({
            plainText: this.password,
          });
        }
      });

      return userSchema;
    },
  },
]);
