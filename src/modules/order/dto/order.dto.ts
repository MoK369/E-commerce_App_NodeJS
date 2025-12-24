import {
  IsNotEmpty,
  IsMongoId,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsEnum,
} from 'class-validator';
import { Types } from 'mongoose';
import { AppRegex, ICoupon, IOrder, PaymentTypesEnum } from 'src/common';

export class CreateOrderDto implements Partial<IOrder> {
  @Matches(AppRegex.addressRegex)
  @IsNotEmpty()
  @IsString()
  address: string;

  @Matches(AppRegex.phoneNumberRegex)
  @IsNotEmpty()
  @IsString()
  phone: string;

  @MaxLength(500)
  @MinLength(2)
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  note: string;

  @IsMongoId()
  @IsOptional()
  coupon?: Types.ObjectId;

  @IsEnum(PaymentTypesEnum)
  payment: PaymentTypesEnum;
}

export class OrderParamsDto {
  @IsMongoId()
  orderId: Types.ObjectId;
}
