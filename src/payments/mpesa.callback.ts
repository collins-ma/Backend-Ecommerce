import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentMappingService } from './payment-mapping.service';

@Controller('payments/callbacks/mpesa')
export class MpesaCallbackController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly paymentMappingService: PaymentMappingService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleCallback(@Body() body: any) {
    console.log('✅ M-Pesa Callback received:', JSON.stringify(body, null, 2));

    const stkCallback = body?.Body?.stkCallback;
    if (!stkCallback) {
      console.warn('⚠️ Invalid M-Pesa callback payload.');
      return { message: 'Invalid callback format' };
    }

    let orderId: string | undefined;

    // Check for successful payment
    const metadataItems = stkCallback.CallbackMetadata?.Item || [];
    const orderIdItem = metadataItems.find((item: any) => item.Name === 'AccountReference');

    if (orderIdItem) {
      orderId = orderIdItem.Value;
    } else {
      // Failed payment → lookup by CheckoutRequestID
      const mapping = await this.paymentMappingService.findByCheckoutRequestId(
        stkCallback.CheckoutRequestID,
      );
      orderId = mapping?.orderId.toString()
    }

    const transactionId = stkCallback.CheckoutRequestID;
    const resultCode = stkCallback.ResultCode;
    const resultDesc = stkCallback.ResultDesc;

    const isSuccess = resultCode === 0;

    console.log(`🔔 Payment for Order ID ${orderId} was ${isSuccess ? 'successful' : 'unsuccessful'}.`);

    await this.paymentsService.confirmPayment(orderId!, {
      success: isSuccess,
      transactionId,
      reason: resultDesc,
    });

    return { message: 'Callback processed successfully' };
  }
}
