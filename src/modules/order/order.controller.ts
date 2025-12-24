import {
  Body,
  Controller,
  Param,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import OrderService from './order.service';
import { ApplyAuthentication } from 'src/common/decorators/auths.decorator';
import { IResponse, successResponseHandler, User } from 'src/common';
import { type HydratedUser } from 'src/db';
import { CreateOrderDto, OrderParamsDto } from './dto/order.dto';
import { CheckoutResponse, OrderResponse } from './entities/order.entities';

@UsePipes(
  new ValidationPipe({
    stopAtFirstError: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
@Controller('order')
class OrderController {
  constructor(private readonly _orderService: OrderService) {}

  @ApplyAuthentication()
  @Post()
  async createOrder(
    @Body() body: CreateOrderDto,
    @User() user: HydratedUser,
  ): Promise<IResponse<OrderResponse>> {
    return successResponseHandler<OrderResponse>({
      data: { order: await this._orderService.createOrder({ body, user }) },
    });
  }

  @ApplyAuthentication()
  @Post(':orderId/checkout')
  async check(
    @Param() params: OrderParamsDto,
    @User() user: HydratedUser,
  ): Promise<IResponse<CheckoutResponse>> {
    return successResponseHandler<CheckoutResponse>({
      data: {
        session: await this._orderService.getCheckoutSession({
          orderId: params.orderId,
          user,
        }),
      },
    });
  }
}

export default OrderController;
