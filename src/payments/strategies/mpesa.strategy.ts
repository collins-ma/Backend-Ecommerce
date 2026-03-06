import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PaymentMappingService } from '../payment-mapping.service';
import { lastValueFrom } from 'rxjs';
import { MpesaError } from '../../../all-exceptions.filter';

@Injectable()
export class MpesaStrategy {
  private readonly baseUrl: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    private readonly paymentMappingService: PaymentMappingService,
  ) {
    // Base URL depends on sandbox or production
    this.baseUrl = this.config.get('MPESA_BASE_URL') || 'https://sandbox.safaricom.co.ke';
  }

  /** =========================
   *  1️⃣ Get OAuth Token
   *  Uses Consumer Key + Consumer Secret
   *  ✅ Returns safe error messages
   * ========================== */
  private async getAccessToken(): Promise<string> {
    const url = `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`;
    const consumerKey = this.config.get<string>('MPESA_CONSUMER_KEY');
    const consumerSecret = this.config.get<string>('MPESA_CONSUMER_SECRET');

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    try {
      const { data } = await lastValueFrom(
        this.http.get(url, {
          headers: { Authorization: `Basic ${auth}` },
        }),
      );

      if (!data?.access_token) {

        throw new MpesaError('Payment service is currently unavailable. Please try again later.');
      }

      return data.access_token;
    } catch (err: any) {
    
      throw new MpesaError('Payment service is currently unavailable. Please try again later.');
    }
  }

  
  private generateTimestamp(): string {
    const now = new Date();
    const eatOffset = 3 * 60; 
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const eatTime = new Date(utc + eatOffset * 60000);

    return (
      eatTime.getFullYear().toString() +
      String(eatTime.getMonth() + 1).padStart(2, '0') +
      String(eatTime.getDate()).padStart(2, '0') +
      String(eatTime.getHours()).padStart(2, '0') +
      String(eatTime.getMinutes()).padStart(2, '0') +
      String(eatTime.getSeconds()).padStart(2, '0')
    );
  }

 
  async initiatePayment(phoneNumber: string, amount: number, orderId: string) {
    try {
      const token = await this.getAccessToken();

      const shortcode = this.config.get<string>('MPESA_SHORTCODE'); // e.g., 174379 sandbox
      const passkey = this.config.get<string>('MPESA_PASSKEY');     // sandbox passkey
      const timestamp = this.generateTimestamp();
      const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

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
        AccountReference: orderId,
        TransactionDesc: `Payment for order ${orderId}`,
      };

      

      const { data } = await lastValueFrom(
        this.http.post(`${this.baseUrl}/mpesa/stkpush/v1/processrequest`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      if (data?.ResponseCode !== '0') {
        
       
        throw new MpesaError('Payment initiation failed. Please try again.');
      }

      await this.paymentMappingService.create({
        orderId,
        checkoutRequestId: data.CheckoutRequestID,
      });

      return data;
    } catch (err: any) {
     
      
      throw new MpesaError('Payment service is currently unavailable. Please try again later.');
    }
  }
}