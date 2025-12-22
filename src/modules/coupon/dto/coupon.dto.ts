import { Type } from 'class-transformer';
import {
    IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { CouponTypesEnum, ICoupon, IsAfterDate, IsFutureDate } from 'src/common';

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

  @IsAfterDate("startDate")
  @IsDateString()
  endDate?: Date | undefined;
}
