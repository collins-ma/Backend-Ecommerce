import { Controller, Post, Body, Req, BadRequestException, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guard/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('initiate')
  async initiate(@Req() req: any, @Body() body: { phoneNumber: string; shippingAddress: any }) {
    if (!body.phoneNumber) throw new BadRequestException('Phone number is required');
    return this.paymentsService.initiateCart(req.user._id, body.phoneNumber, body.shippingAddress);
  }
}