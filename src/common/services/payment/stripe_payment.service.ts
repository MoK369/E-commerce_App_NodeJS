import { BadRequestException, Injectable } from '@nestjs/common';
import { type Request } from 'express';
import Stripe from 'stripe';

@Injectable()
class PaymentService {
  private _stripeInstance: Stripe;

  constructor() {
    this._stripeInstance = new Stripe(process.env.STRIPE_SECRET!);
  }

  async checkoutSession({
    payment_method_types = ['card'],
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
      payment_method_types,
      customer_email,
      cancel_url,
      success_url,
      metadata,
      discounts,
      mode,
      line_items,
    });
  }

  async createCoupon(
    data: Stripe.CouponCreateParams,
  ): Promise<Stripe.Response<Stripe.Coupon>> {
    return this._stripeInstance.coupons.create(data);
  }

  async webhook(req: Request): Promise<Stripe.CheckoutSessionCompletedEvent> {
    const event = this._stripeInstance.webhooks.constructEvent(
      req.body,
      req.headers['stripe-signature']!,
      process.env.STRIPE_HOOK_SECRET!,
    );

    if (event.type != 'checkout.session.completed') {
      throw new BadRequestException('Payment Failed 🚫');
    }

    return event;
  }

  async createPaymentMethod(
    data: Stripe.PaymentMethodCreateParams,
  ): Promise<Stripe.Response<Stripe.PaymentMethod>> {
    return this._stripeInstance.paymentMethods.create(data);
  }

  async createPaymentIntent(
    data: Stripe.PaymentIntentCreateParams,
  ): Promise<Stripe.Response<Stripe.PaymentIntent>> {
    return this._stripeInstance.paymentIntents.create(data);
  }

  async retreivePaymentIntent(
    id: string,
  ): Promise<Stripe.Response<Stripe.PaymentIntent>> {
    return this._stripeInstance.paymentIntents.retrieve(id);
  }

  async confirmPaymentIntent(
    id: string,
  ): Promise<Stripe.Response<Stripe.PaymentIntent>> {
    const intent = await this.retreivePaymentIntent(id);
    if (!intent) {
      throw new BadRequestException(
        'Failed to find matching payment intent ❌',
      );
    }
    if (intent.status != 'requires_confirmation') {
      throw new BadRequestException('Payment intent is already confirmed ❌');
    }
    return this._stripeInstance.paymentIntents.confirm(id);
  }

  async refund(id: string): Promise<Stripe.Response<Stripe.Refund>> {
    const intent = await this.retreivePaymentIntent(id);
    if (intent.status != 'succeeded') {
      throw new BadRequestException(
        "Can't refund not Succeeded Pyament Intent ❌🫸",
      );
    }

    return this._stripeInstance.refunds.create({ payment_intent: intent.id });
  }
}

export default PaymentService;
