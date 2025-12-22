import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import {
  CartRepository,
  HydratedCart,
  HydratedUser,
  ProductRepository,
} from 'src/db';
import { AddToCartDto, RemoveItemsFromCartDto } from './dto/cart.dto';
import { Types } from 'mongoose';

@Injectable()
class CartService {
  constructor(
    private readonly _cartRepository: CartRepository,
    private readonly _productRepository: ProductRepository,
  ) {}

  async addToCart({
    body,
    user,
  }: {
    body: AddToCartDto;
    user: HydratedUser;
  }): Promise<{ status: number; cart: HydratedCart }> {
    const product = await this._productRepository.findOne({
      filter: { _id: body.product, stock: { $gte: body.quantity } },
    });

    if (!product) {
      throw new NotFoundException(
        'Invalid productId or quantity out of stock ⛔',
      );
    }

    const cart = await this._cartRepository.findOne({
      filter: { createdBy: user._id },
    });

    if (!cart) {
      const [newCart] = await this._cartRepository.create({
        data: [
          {
            createdBy: user._id,
            products: [{ product: product._id, quantity: body.quantity }],
          },
        ],
      });
      if (!newCart) {
        throw new InternalServerErrorException('Failed to create use cart');
      }
      return { status: 201, cart: newCart };
    }
    const productInCart = cart.products.find((pro) => {
      return product._id.equals(pro.product as Types.ObjectId);
    });
    if (productInCart) {
      productInCart.quantity = body.quantity;
    } else {
      if (cart.products.length >= 500) {
        throw new BadRequestException(
          'Maximum number of cart items is 500 🛒🔒',
        );
      }
      cart.products.push({ product: product._id, quantity: body.quantity });
    }

    cart.increment();
    await cart.save({ validateBeforeSave: true });

    return { status: 200, cart };
  }

  async findUserCart({ user }: { user: HydratedUser }): Promise<HydratedCart> {
    const cart = await this._cartRepository.findOne({
      filter: { createdBy: user._id },
      options: {
        populate: [
          {
            path: 'products.product',
            select:
              'name slug images originalPrice discountPercent salePrice stock',
          },
        ],
      },
    });

    if (!cart) {
      throw new NotFoundException('Failed to find matching cart ❌');
    }
    return cart;
  }

  async removeFromCart({
    body,
    user,
  }: {
    body: RemoveItemsFromCartDto;
    user: HydratedUser;
  }): Promise<HydratedCart> {
    const cart = await this._cartRepository.findOneAndUpdate({
      filter: { createdBy: user._id },
      update: { $pull: { products: { _id: { $in: body.itemIds } } } },
    });

    if (!cart) {
      throw new NotFoundException('Failed to find matching cart ❌');
    }
    return cart;
  }

  async removeCart({ user }: { user: HydratedUser }) {
    if (
      !(
        await this._cartRepository.deleteOne({
          filter: { createdBy: user._id },
        })
      ).deletedCount
    ) {
      throw new NotFoundException('Failed to find matching user cart ❌');
    }
  }
}
export default CartService;
