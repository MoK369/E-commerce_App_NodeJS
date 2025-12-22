import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Res,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApplyAuthentication } from 'src/common/decorators/auths.decorator';
import CartService from './cart.service';
import { IResponse, successResponseHandler, User } from 'src/common';
import { type HydratedUser } from 'src/db';
import { AddToCartDto, RemoveItemsFromCartDto } from './dto/cart.dto';
import { CartResponse } from './entities/cart.entities';
import { type Response } from 'express';
import { RemoveFieldsWithType } from '@nestjs/mapped-types/dist/types/remove-fields-with-type.type';

@ApplyAuthentication()
@UsePipes(
  new ValidationPipe({
    stopAtFirstError: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
@Controller('cart')
class CartController {
  constructor(private readonly _cartService: CartService) {}

  @Post()
  async addToCart(
    @User() user: HydratedUser,
    @Body() body: AddToCartDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { cart, status } = await this._cartService.addToCart({ body, user });

    res.status(status);
    return successResponseHandler<CartResponse>({ data: { cart } });
  }

  @Get()
  async findUserCart(
    @User() user: HydratedUser,
  ): Promise<IResponse<CartResponse>> {
    return successResponseHandler<CartResponse>({
      data: { cart: await this._cartService.findUserCart({ user }) },
    });
  }

  @Patch('remove-from-cart')
  async removeFromCart(
    @User() user: HydratedUser,
    @Body() body: RemoveItemsFromCartDto,
  ): Promise<IResponse<CartResponse>> {
    return successResponseHandler<CartResponse>({
      data: { cart: await this._cartService.removeFromCart({ body, user }) },
    });
  }

  @Delete()
  async removeCart(@User() user: HydratedUser) {
    await this._cartService.removeCart({ user });

    return successResponseHandler({ message: 'Cart Removed Successfully ✅🗑️' });
  }
}

export default CartController;
