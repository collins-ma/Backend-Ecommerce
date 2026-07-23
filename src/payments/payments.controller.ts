import { Controller, Post, Body, Req, BadRequestException, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guard/auth.guard';
import { CheckoutMethod} from '../orders/enums/checkout-method.enum';

@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
  ) {}

  @Post('initiate')
  
  async initiate(
    @Req() req: any,
    @Body()
    body: {
      checkoutMethod: CheckoutMethod,
      phoneNumber?: string;
      shippingAddress: any;
    },
  ) {
    // Phone number is only required for M-Pesa
    if (
      body.checkoutMethod === CheckoutMethod.MPESA &&
      !body.phoneNumber
    ) {
      throw new BadRequestException(
        'Phone number is required for M-Pesa payment.',
      );
    }

    return this.paymentsService.initiateCart(
      req.user._id,
      body.checkoutMethod,
      body.shippingAddress,
      body.phoneNumber,
    );
  }
}