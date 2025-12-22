import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsMongoId,
  IsNumber,
  IsPositive,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Types } from 'mongoose';
import { AreMongoIds, ICartProduct, IProduct } from 'src/common';

export class AddToCartDto implements Partial<ICartProduct> {
  @IsMongoId()
  product: Types.ObjectId;

  @Type(() => Number)
  @Max(500)
  @Min(1)
  @IsPositive()
  @IsInt()
  @IsNumber()
  quantity: number;
}

export class RemoveItemsFromCartDto {
  @AreMongoIds()
  @ArrayMaxSize(500)
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsArray()
  itemIds: Types.ObjectId[];
}
