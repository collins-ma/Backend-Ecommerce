import { Controller, Post, Body, Req, BadRequestException, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import type { InitiatePaymentDto } from './payments.dto';
import { JwtAuthGuard } from '../auth/guard/auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('initiate')
  async initiate(@Req() req: any, @Body() body: InitiatePaymentDto) {
    const userId = req.user._id;
    console.log('User ID from request:', userId);

    console.log('Initiating payment for user:', userId, 'with body:', body);

    switch (body.method) {
      case 'mpesa':
        if (!body.phoneNumber) {
          throw new BadRequestException('Phone number is required for Mpesa');
        }
        return this.paymentsService.initiateCart(
          userId,
          'mpesa',
          body.phoneNumber,
          undefined,
          body.shippingAddress
        );

      case 'stripe':
        if (!body.email) {
          throw new BadRequestException('Email is required for Stripe');
        }
        return this.paymentsService.initiateCart(
          userId,
          'stripe',
          undefined, // no phone
          body.email,

        );

      case 'paypal':
        return this.paymentsService.initiateCart(
          userId,
          'paypal',
        );

      default:
        throw new BadRequestException('Unsupported payment method');
    }
  }
}
