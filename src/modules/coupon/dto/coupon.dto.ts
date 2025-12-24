import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Types } from 'mongoose';
import { ICoupon, IsFutureDate } from 'src/common';
import { IsAfterDate } from 'src/common/decorators/after_date.decorator';
import { CouponTypesEnum } from 'src/common/enums/coupon.enum';

export class CreateCouponDto implements Partial<ICoupon> {
  @MaxLength(50)
  @MinLength(2)
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsEnum(CouponTypesEnum)
  type: CouponTypesEnum;

  @Type(() => Number)
  @IsPositive()
  @IsNumber()
  discount: number;

  @Type(() => Number)
  @IsInt()
  @IsNumber()
  duration?: number | undefined;

  @IsFutureDate()
  @IsDateString()
  startDate?: Date | undefined;

  @IsAfterDate('startDate')
  @IsDateString()
  endDate?: Date | undefined;
}

export class CouponParamsDto {
  @IsMongoId()
  couponId: Types.ObjectId;
}

export class UpdateCouponDto extends PartialType(CreateCouponDto) {}
