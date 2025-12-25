import { Module } from '@nestjs/common';
import { SharedAuthenticationModule } from 'src/common/modules';
import S3Module from 'src/common/modules/s3.module';
import {
  CartModel,
  CartRepository,
  CouponModel,
  CouponRepository,
  OrderModel,
  OrderRepository,
  ProductModel,
  ProductRepository,
} from 'src/db';
import OrderService from './order.service';
import OrderController from './order.controller';
import { PaymentService } from 'src/common';

@Module({
  imports: [
    SharedAuthenticationModule,
    S3Module,
    OrderModel,
    ProductModel,
    CouponModel,
    CartModel,
  ],
  exports: [],
  controllers: [OrderController],
  providers: [
    OrderService,
    OrderRepository,
    CouponRepository,
    CartRepository,
    ProductRepository,
    PaymentService,
  ],
})
class OrderModule {}

export default OrderModule;
