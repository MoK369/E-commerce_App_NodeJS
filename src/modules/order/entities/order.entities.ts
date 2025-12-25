import { IOrder } from 'src/common';
import Stripe from 'stripe';

export class OrderResponse {
  order: IOrder;
}

export class CheckoutResponse {
  session: Stripe.Response<Stripe.Checkout.Session>;
}
