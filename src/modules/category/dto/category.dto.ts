import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
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
import { ContainField, IBrand } from 'src/common';
import AreMongoIds from 'src/common/decorators/are_mongo_Ids.decorator';

export class CreateCategoryDto implements Partial<IBrand> {
  @MaxLength(50)
  @MinLength(2)
  @IsString()
  name: string;

  @MaxLength(5_000)
  @MinLength(5)
  @IsString()
  @IsOptional()
  description?: string;

  @AreMongoIds()
  @IsNotEmpty({ each: true })
  @IsString({ each: true })
  @ArrayMaxSize(10)
  @ArrayMinSize(1)
  @IsArray()
  @IsOptional()
  brands?: Types.ObjectId[];
}

export class CategoryParamsDto {
  @IsMongoId()
  categoryId: Types.ObjectId;
}

@ContainField()
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
  @AreMongoIds()
  @IsNotEmpty({ each: true })
  @IsString({ each: true })
  @ArrayMaxSize(10)
  @ArrayMinSize(1)
  @IsArray()
  @IsOptional()
  removeBrands?: Types.ObjectId[];
}