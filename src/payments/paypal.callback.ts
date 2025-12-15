import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaypalStrategy } from './strategies/paypal.strategy';

@Controller('payments/callbacks')
export class PaypalCallbackController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly paypal: PaypalStrategy,
  ) {}

  @Post('paypal')
  @HttpCode(HttpStatus.OK)
  async handlePaypalCallback(@Body() body: any) {
    const { paypalOrderId, orderId } = body;

    if (!paypalOrderId || !orderId) {
      return { message: 'Invalid callback payload.' };
    }

    if (!this.paypal) {
      throw new Error('PayPal service is not initialized.');
    }

    // Capture the PayPal payment
    const capture = await this.paypal.captureOrder(paypalOrderId);

    // ✅ If payment completed successfully
    if (capture.status === 'COMPLETED') {
      await this.paymentsService.confirmPayment(orderId, {
        success: true,
        transactionId: capture.id,
      });
    } 
    // ❌ If payment failed or not completed
    else {
      await this.paymentsService.confirmPayment(orderId, {
        success: false,
        reason: capture.status,
      });
    }

    return { message: 'PayPal callback processed.' };
  }
}
