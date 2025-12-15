import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PaymentMappingService } from '../payment-mapping.service';
import { MpesaError } from '../../../all-exceptions.filter';

@Injectable()
export class MpesaStrategy {
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    private readonly paymentMappingService: PaymentMappingService,
  ) {}

  private async getAccessToken() {
    const url =
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
    const auth = Buffer.from(
      `${this.config.get('MPESA_CONSUMER_KEY')}:${this.config.get(
        'MPESA_CONSUMER_SECRET',
      )}`,
    ).toString('base64');

    const response = await this.http.axiosRef.get(url, {
      headers: { Authorization: `Basic ${auth}` },
    });

    if (!response.data.access_token) {
      throw new MpesaError('Failed to obtain M-Pesa access token');
    }

    return response.data.access_token;
  }

  async initiatePayment(phoneNumber: string, amount: number, orderId: string) {
    const token = await this.getAccessToken();

    const shortcode = this.config.get('MPESA_SHORTCODE');
    const passkey = this.config.get('MPESA_PASSKEY');
    const timestamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
    const password = Buffer.from(shortcode + passkey + timestamp).toString('base64');

    const payload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: shortcode,
      PhoneNumber: phoneNumber,
      CallBackURL: this.config.get('MPESA_CALLBACK_URL'),
      AccountReference: orderId, // internal order ID
      TransactionDesc: `Payment for order ${orderId}`,
    };

    const response = await this.http.axiosRef.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      payload,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (response.data.ResponseCode !== '0') {
      throw new MpesaError('M-Pesa payment initiation failed.');
    }

    // Save mapping for failed payment lookup
    await this.paymentMappingService.create({
      orderId,
      checkoutRequestId: response.data.CheckoutRequestID,
    });

    return response.data;
  }
}
