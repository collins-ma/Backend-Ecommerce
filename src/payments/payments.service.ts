import { Injectable, BadRequestException } from '@nestjs/common';
import { OrderService } from '../orders/orders.service';
import { CartService } from '../cart/cart.service';
import { MpesaStrategy } from './strategies/mpesa.strategy';
import { ShippingAddressDto } from './payments.dto';
import { Types } from 'mongoose';
import { Product } from 'src/products/schema/product.schema';
import { PaymentMethod } from 'src/orders/enums/payment-method.enum';
import { PaymentStatus } from 'src/orders/enums/payment-status.enum';
@Injectable()
export class PaymentsService {
  constructor(
    private readonly mpesa: MpesaStrategy,
    private readonly ordersService: OrderService,
    private readonly cartService: CartService,
  ) {}

  
 async initiateCart(
  userId: string,
  paymentMethod: PaymentMethod,
  shippingAddress: ShippingAddressDto,
  phoneNumber?: string,
) {

  if (
  paymentMethod === PaymentMethod.MPESA &&
  !phoneNumber
) {
  throw new BadRequestException(
    'Phone number is required for M-Pesa payment.',
  );
}

    
    const cart = await this.cartService.getCart(userId);
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

   
    const order = await this.ordersService.createOrder(
  userId,

  paymentMethod,
  shippingAddress,
);
  

if (paymentMethod === PaymentMethod.MPESA) {
  const paymentResponse = await this.mpesa.initiatePayment(
    phoneNumber!,
    order.total,
    order._id.toString(),
  );

  return {
    orderId: order._id.toString(),
    method: paymentMethod,
    currency: 'KES',
    totalToPay: order.total,
    paymentResponse,
    status: order.paymentStatus,
  };
}

// Cash on Delivery
await this.cartService.clearCart(userId);

return {
  orderId: order._id.toString(),
  method: paymentMethod,
  currency: 'KES',
  totalToPay: order.total,
  status: order.paymentStatus,
  message: 'Order placed successfully. Pay when your order is delivered.',
};
}

    
async confirmPayment(
  orderId: string,
  result: {
    success: boolean;
    transactionId?: string;
    reason?: string;
  },
) {
  const order = await this.ordersService.findById(orderId);

  if (!order) {
    throw new BadRequestException('Order not found');
  }

  // Ignore duplicate callbacks
  if (order.paymentStatus !== PaymentStatus.PENDING) {
    return order;
  }

  if (result.success) {
    if (!result.transactionId) {
      throw new BadRequestException(
        'Transaction ID missing for successful payment.',
      );
    }

    const updatedOrder =
      await this.ordersService.markAsPaid(
        orderId,
        result.transactionId,
      );

    // Customer has paid successfully.
    // Safe to clear the cart.
    await this.cartService.clearCart(
      order.user.toString(),
    );

    return updatedOrder;
  }

  return this.ordersService.failPayment(
    orderId,
    result.reason ?? 'Unknown payment error.',
  );
}


}