import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
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

export class CreateBrandDto implements Partial<IBrand> {
  @MaxLength(50)
  @MinLength(2)
  @IsString()
  name: string;

  @MaxLength(50)
  @MinLength(2)
  @IsString()
  slogan: string;
}

export class BrandParamsDto {
  @IsMongoId()
  brandId: Types.ObjectId;
}

@ContainField()
export class UpdateBrandDto extends PartialType(CreateBrandDto) {}
