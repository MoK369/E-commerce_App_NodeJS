import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
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
import { AreMongoIds, ContainField, IProduct } from 'src/common';

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

export class ProductParamsDto {
  @IsMongoId()
  productId: Types.ObjectId;
}

export class RemoveFromWishlistDto {
  @AreMongoIds()
  @ArrayMaxSize(500)
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsArray()
  productIds: Types.ObjectId[];
}

@ContainField()
export class UpdateProductDto extends PartialType(CreateProductDto) {}

export class updateProductAttachmentsDto {
  @ArrayMaxSize(5)
  @ArrayMinSize(1)
  @IsNotEmpty({ each: true })
  @IsString({ each: true })
  @IsArray()
  @IsOptional()
  removeAttachments: string[];
}
