import { Module } from '@nestjs/common';
import { SharedAuthenticationModule } from 'src/common/modules';
import S3Module from 'src/common/modules/s3.module';
import {
  CartModel,
  CartRepository,
  ProductModel,
  ProductRepository,
} from 'src/db';
import CartController from './cart.controller';
import CartService from './cart.service';

@Module({
  imports: [SharedAuthenticationModule, S3Module, CartModel, ProductModel],
  exports: [],
  controllers: [CartController],
  providers: [CartService, CartRepository, ProductRepository],
})
class CartModule {}

export default CartModule;
