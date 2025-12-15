import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { StripeError } from 'all-exceptions.filter';

@Injectable()
export class StripeStrategy {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(StripeStrategy.name);

  constructor(private readonly config: ConfigService) {
    this.stripe = new Stripe(this.config.get<string>('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2025-10-29.clover',
    });
  }

  /** 🔹 Step 1: Create a Payment Intent */
  async createPaymentIntent(orderId: string, amount: number, email: string) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe uses cents
        currency: this.config.get('STRIPE_CURRENCY') || 'usd',
        metadata: { orderId, email },
        receipt_email: email,
        automatic_payment_methods: { enabled: true },
      });

      if (!paymentIntent.client_secret) {
        throw new StripeError('Stripe did not return a client secret');
      }

      this.logger.log(`✅ Created Stripe payment intent for order ${orderId}`);
      return { clientSecret: paymentIntent.client_secret };
    } catch (error: any) {
      this.logger.error('❌ Stripe payment failed', error.message);
      throw new StripeError(error.message || 'Failed to create Stripe payment intent');
    }
  }

  /** 🔹 Step 2: Verify and Handle Webhook Event */
  verifyWebhook(signature: string, payload: Buffer) {
    try {
      const endpointSecret = this.config.get('STRIPE_WEBHOOK_SECRET');
      const event = this.stripe.webhooks.constructEvent(payload, signature, endpointSecret);
      return event;
    } catch (err: any) {
      this.logger.error('❌ Stripe webhook verification failed', err.message);
      throw new StripeError('Invalid Stripe webhook signature');
    }
  }
}
