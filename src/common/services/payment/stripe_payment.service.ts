import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
class StripePaymentService {
  private _stripeInstance: Stripe;

  constructor() {
    this._stripeInstance = new Stripe(process.env.STRIPE_SECRET!);
  }

  async checkoutSession({
    customer_email,
    cancel_url = process.env.CANCEL_URL!,
    success_url = process.env.SUCCESS_URL!,
    metadata = {},
    discounts = [],
    mode = 'payment',
    line_items,
  }: Stripe.Checkout.SessionCreateParams): Promise<
    Stripe.Response<Stripe.Checkout.Session>
  > {
    return this._stripeInstance.checkout.sessions.create({
      customer_email,
      cancel_url,
      success_url,
      metadata,
      discounts,
      mode,
      line_items,
    });
  }
}

export default StripePaymentService;
