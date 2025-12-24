import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  CartRepository,
  CouponRepository,
  HydratedCoupon,
  HydratedOrder,
  HydratedUser,
  OrderRepository,
  ProductRepository,
} from 'src/db';
import { CreateOrderDto } from './dto/order.dto';
import {
  CouponTypesEnum,
  IdService,
  IOrderProduct,
  IProduct,
  OrderStatusEnum,
  PaymentTypesEnum,
  StripePaymentService,
} from 'src/common';
import { Types } from 'mongoose';
import Stripe from 'stripe';

@Injectable()
class OrderService {
  constructor(
    private readonly _orderRepository: OrderRepository,
    private readonly _couponRepository: CouponRepository,
    private readonly _cartRepository: CartRepository,
    private readonly _productRepository: ProductRepository,
    private readonly _idService: IdService,
    private readonly _stripePaymentService: StripePaymentService,
  ) {}

  async createOrder({
    body,
    user,
  }: {
    body: CreateOrderDto;
    user: HydratedUser;
  }): Promise<HydratedOrder> {
    const cart = await this._cartRepository.findOne({
      filter: { createdBy: user._id },
      options: { populate: [{ path: 'products.product', select: 'name' }] },
    });
    if (!cart?.products?.length) {
      throw new NotFoundException('Cart is empty ❌');
    }

    let coupon: HydratedCoupon | undefined | null;
    if (body.coupon) {
      coupon = await this._couponRepository.findOne({
        filter: {
          _id: body.coupon,
          startDate: { $lte: new Date() },
          endDate: { $gte: new Date() },
        },
      });
      if (!coupon) {
        throw new NotFoundException(
          'Failed to find matching coupon or coupon has ended ⛔',
        );
      }
      if (
        coupon.duration <=
        coupon.usedBy.filter((id) => user._id.equals(id.toString())).length
      ) {
        throw new ConflictException(
          `Sorry! you have reached the limit for this coupon ❌ The coupon can only be use ${coupon.duration} time(s) per user `,
        );
      }
    }

    let total = 0;
    let discount = 0;
    const products: IOrderProduct[] = [];
    for (const product of cart.products) {
      const cartProduct = await this._productRepository.findOne({
        filter: { _id: product.product, stock: { $gte: product.quantity } },
      });

      if (!cartProduct) {
        throw new NotFoundException(
          `Failed to find cart product ${(product.product as IProduct).name}  or out of stock 😧`,
        );
      }
      const finalPrice = cartProduct.salePrice * product.quantity;
      products.push({
        product: cartProduct._id,
        quantity: product.quantity,
        unitPrice: cartProduct.salePrice,
        finalPrice,
      });
      total += finalPrice;
    }

    if (coupon) {
      discount =
        coupon.type === CouponTypesEnum.Percent
          ? coupon.discount
          : (coupon.discount / total) * 100;
    }

    delete body.coupon;
    const [order] = await this._orderRepository.create({
      data: [
        {
          ...body,
          coupon: coupon?._id,
          discount,
          orderId: this._idService.generateAlphaNumaricId({ size: 8 }),
          products,
          total,
          createdBy: user._id,
        },
      ],
    });

    if (!order) {
      throw new InternalServerErrorException('Failed to create the order ❌');
    }

    // Post Events
    if (coupon) {
      (coupon.usedBy as Types.ObjectId[]).push(user._id);
      await coupon.save();
    }

    for (const product of cart.products) {
      await this._productRepository.updateOne({
        filter: { _id: product.product, stock: { $gte: product.quantity } },
        update: {
          $inc: { stock: -product.quantity },
        },
      });
    }

    //await this._cartRepository.deleteOne({ filter: { createdBy: user._id } });

    return order;
  }

  async getCheckoutSession({
    orderId,
    user,
  }: {
    orderId: Types.ObjectId;
    user: HydratedUser;
  }): Promise<Stripe.Response<Stripe.Checkout.Session>> {
    const order = await this._orderRepository.findOne({
      filter: {
        _id: orderId,
        createdBy: user._id,
        payment: PaymentTypesEnum.card,
        status: OrderStatusEnum.pending,
      },
      options: { populate: [{ path: 'products.product', select: 'name' }] },
    });

    if (!order) {
      throw new NotFoundException('Failed to find matching order ❌');
    }

    const session = await this._stripePaymentService.checkoutSession({
      customer_email: user.email,
      metadata: { orderId: orderId.toString() },
      line_items:
        order.products.map<Stripe.Checkout.SessionCreateParams.LineItem>(
          (p) => {
            return {
              quantity: p.quantity,
              price_data: {
                currency: 'egp',
                product_data: {
                  name: (p.product as IProduct).name,
                },
                unit_amount: p.unitPrice * 100,
              },
            };
          },
        ),
    });

    return session;
  }
}

export default OrderService;
