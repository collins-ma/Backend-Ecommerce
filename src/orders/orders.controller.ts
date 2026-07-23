import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Delete, 
  Param, 
  Req, 
  Body, 
  UseGuards, 
  NotFoundException 
} from '@nestjs/common';
import { OrderService } from './orders.service';
import { JwtAuthGuard } from 'src/auth/guard/auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorators';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { OrderStatus } from './enums/order-status.enum';
import { CompleteRefundDto } from './dto/complete-refund.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

 @Roles('admin')
@Patch(':id/record-mpesa-payment')
recordMpesaPayment(
  @Param('id') id: string,
  @Body('transactionId') transactionId: string,
) {
  return this.orderService.recordMpesaPayment(
    id,
    transactionId,
  );
}




@Roles('admin')
@Patch(':id/record-cash-payment')
recordCashPayment(
  @Param('id') id: string,
) {
  return this.orderService.recordCashPayment(id);
}

   
  @Roles('user')
  @Get(':orderId/status')
  async getOrderStatus(@Param('orderId') orderId: string, @Req() req: any) {
    const userId = req.user._id;

    const result = await this.orderService.getOrderStatus(orderId, userId);
    if (!result) throw new NotFoundException('Order not found');

    return result;
  }

  @Roles('admin')
@Patch(':id/payment')
markAsPaid(
  @Param('id') id: string,
) {
  return this.orderService.markAsPaid(id);
}


@Roles('admin','user')
@Patch(':id/cancel')
cancelOrder(
  @Param('id') id: string,
  @Body('reason') reason?: string,
) {
  return this.orderService.cancelOrder(
    id,
    reason,
  );
}

  @Roles('admin')
  @Get()
  findAll() {
    return this.orderService.findAll();
  }

  
  @Roles('user')
  @Get('my')
  async findMyOrders(@Req() req:any) {
    const userId = req.user._id; 
    return this.orderService.findByUser(userId);
  }

  
  @Roles('admin','user')
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.orderService.findById(id);
  }


@Roles('admin')
@Patch(':id/complete-refund')
completeRefund(
  @Param('id') id: string,
  @Body() dto: CompleteRefundDto,
) {
  return this.orderService.completeRefund(id, dto);
}

  @Roles('admin')
@Patch(':id/status')
updateStatus(
  @Param('id') id: string,
  @Body('status') status: OrderStatus,
) {
  return this.orderService.updateOrderStatus(id, status);

}
}