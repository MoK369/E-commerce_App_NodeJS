import {
  MongooseModule,
  Prop,
  Schema,
  SchemaFactory,
  Virtual,
} from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import {
  GenderEnum,
  HashingUtil,
  ProvidersEnum,
  UserRolesEnum,
} from 'src/common';
import { HydratedOtp, Otp } from './otp.model';

@Schema({
  strictQuery: true,
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class User {
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
  provider: string;

  @Prop({
    type: String,
    enum: Object.values(GenderEnum),
    default: GenderEnum.male,
  })
  gender: GenderEnum;

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

  @Virtual()
  otps: HydratedOtp[];
}

export type HydratedUser = HydratedDocument<User>;

export const userSchema = SchemaFactory.createForClass(User);

userSchema.virtual('otps', {
  localField: '_id',
  foreignField: 'createdBy',
  ref: 'Otp',
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
