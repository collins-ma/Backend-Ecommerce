import { Injectable, BadRequestException } from '@nestjs/common';
import { OrderService } from '../orders/orders.service';
import { CartService } from '../cart/cart.service';
import { MpesaStrategy } from './strategies/mpesa.strategy';
import { ShippingAddressDto } from './payments.dto';
import { Types } from 'mongoose';
import { Product } from 'src/products/schema/product.schema';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly mpesa: MpesaStrategy,
    private readonly ordersService: OrderService,
    private readonly cartService: CartService,
  ) {}

  
   
  async initiateCart(
    userId: string,
    phoneNumber: string,
    shippingAddress: ShippingAddressDto,
  ) {
    if (!phoneNumber) throw new BadRequestException('Phone number is required for M-Pesa');

    
    const cart = await this.cartService.getCart(userId);
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    
    let totalKsh = 0;
    const orderItems = cart.items
      .filter(i => i.product) 
      .map(i => {
        const product = i.product as Product;
        totalKsh += product.priceKsh * i.quantity;
        return {
          product: new Types.ObjectId(product._id.toString()),
          quantity: i.quantity,
          priceKsh: product.priceKsh,
        };
      });

   
    const order = await this.ordersService.createOrder(
      userId,
      orderItems,
      totalKsh,
      shippingAddress,
    );

   
    const paymentResponse = await this.mpesa.initiatePayment(
      phoneNumber,
      totalKsh,
      order._id.toString(),
    );

    
    return {
      orderId: order._id.toString(),
      method: 'mpesa',
      currency: 'KES',
      totalToPay: totalKsh,
      paymentResponse,
      status: 'pending',
    };
  }

  async confirmPayment(
    orderId: string,
    result: { success: boolean; transactionId?: string; reason?: string },
  ) {
    const order = await this.ordersService.findById(orderId);
    if (!order) throw new BadRequestException('Order not found');

    
    if (order.status !== 'pending') {
      
      return order;
    }

    if (result.success) {
      if (!result.transactionId) throw new BadRequestException('Transaction ID missing for successful payment');

      const updatedOrder = await this.ordersService.markAsPaid(orderId, result.transactionId);

      
      await this.cartService.clearCart(order.user.toString());

      return updatedOrder;
    } else {
      return this.ordersService.failPayment(orderId, result.reason ?? 'Unknown error');
    }
  }
}