import { Type } from 'class-transformer';
import {
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Types } from 'mongoose';
import { IBrand, ICategory, IProduct } from 'src/common';

export class CreateProductDto implements Partial<IProduct> {
  @MaxLength(2_000)
  @MinLength(2)
  @IsString()
  name: string;

  @MaxLength(50_000)
  @MinLength(5)
  @IsString()
  @IsOptional()
  description?: string;

  @Type(() => Number)
  @IsPositive()
  @IsNumber()
  originalPrice: number;

  @Type(() => Number)
  @IsPositive()
  @IsNumber()
  @IsOptional()
  discountPercent?: number;

  @Type(() => Number)
  @IsPositive()
  @IsNumber()
  stock: number;

  @IsMongoId()
  category: Types.ObjectId;

  @IsMongoId()
  brand: Types.ObjectId;
}
