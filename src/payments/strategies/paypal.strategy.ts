import { Injectable } from '@nestjs/common';
import paypal from '@paypal/checkout-server-sdk';
import { ConfigService } from '@nestjs/config';
import { PaypalError } from 'all-exceptions.filter';

@Injectable()
export class PaypalStrategy {
  private client: paypal.core.PayPalHttpClient;

  constructor(private readonly config: ConfigService) {
    const env =
      this.config.get('PAYPAL_MODE') === 'live'
        ? new paypal.core.LiveEnvironment(
            this.config.get('PAYPAL_CLIENT_ID'),
            this.config.get('PAYPAL_CLIENT_SECRET'),
          )
        : new paypal.core.SandboxEnvironment(
            this.config.get('PAYPAL_CLIENT_ID'),
            this.config.get('PAYPAL_CLIENT_SECRET'),
          );

    this.client = new paypal.core.PayPalHttpClient(env);
  }

  async createOrder(orderId: string, amount: number) {
    try {
      const request = new paypal.orders.OrdersCreateRequest();
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: { currency_code: 'USD', value: amount.toFixed(2) },
            reference_id: orderId,
          },
        ],
      });

      const response = await this.client.execute(request);

      if (!response.result.id) {
        throw new PaypalError('Failed to create PayPal order');
      }

      const approvalUrl = response.result.links.find((l) => l.rel === 'approve')?.href;
      return { approvalUrl, orderId: response.result.id };
    } catch (err: any) {
      throw new PaypalError('PayPal order creation failed');
    }
  }

  async captureOrder(orderId: string) {
    try {
      const request = new paypal.orders.OrdersCaptureRequest(orderId);
      request.requestBody({});
      const result = await this.client.execute(request);

      if (result.result.status !== 'COMPLETED') {
        throw new PaypalError('PayPal capture failed');
      }

      return result.result;
    } catch (err: any) {
      throw new PaypalError('PayPal capture failed');
    }
  }
}
