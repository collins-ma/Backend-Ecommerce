import { Controller, Post, Req, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { StripeStrategy } from './strategies/stripe.strategy';
import { PaymentsService } from './payments.service';

@Controller('payments/callbacks/stripe')
export class StripeCallbackController {
  constructor(
    private readonly stripeStrategy: StripeStrategy,
    private readonly paymentsService: PaymentsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleStripeWebhook(
    @Req() req: any,
    @Headers('stripe-signature') signature: string,
  ) {
    const event = this.stripeStrategy.verifyWebhook(signature, req.rawBody);

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as any;
      const orderId = paymentIntent.metadata?.orderId;

      await this.paymentsService.confirmPayment(orderId, {
        success: true,
        transactionId: paymentIntent.id,
      });
    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as any;
      const orderId = paymentIntent.metadata?.orderId;

      await this.paymentsService.confirmPayment(orderId, {
        success: false,
        reason: paymentIntent.last_payment_error?.message || 'Failed',
      });
    }

    return { received: true };
  }
}
