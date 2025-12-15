import { Injectable } from '@nestjs/common';
import { OrderService } from '../orders/orders.service';
import { CartService } from '../cart/cart.service';
import { MpesaStrategy } from './strategies/mpesa.strategy';
import { PaypalStrategy } from './strategies/paypal.strategy';
import { StripeStrategy } from './strategies/stripe.strategy';
import { ShippingAddressDto } from './payments.dto';
import { Types } from 'mongoose';
import { Product } from 'src/products/schema/product.schema';

function convertUSDToKES(amountUSD: number): number {
  const rate = 130; // example rate
  return Math.round(amountUSD * rate);
}

@Injectable()
export class PaymentsService {
  constructor(
    private readonly mpesa: MpesaStrategy,
    private readonly paypal: PaypalStrategy,
    private readonly stripe: StripeStrategy,
    private readonly ordersService: OrderService,
    private readonly cartService: CartService,
  ) {}

  /**
   * Initiates payment using items from user's cart
   */
  async initiateCart(
    userId: string,
    method: 'mpesa' | 'stripe' | 'paypal',
    phoneNumber?: string,
    email?: string,
    shippingAddress?: ShippingAddressDto,
  ) {
    // 1️⃣ Get the user's cart
    const cart = await this.cartService.getCart(userId);
    if (!cart || cart.items.length === 0) {
      throw new Error('Cart is empty');
    }

    // 2️⃣ Compute total
    let totalUSD = 0;
    for (const i of cart.items) {
      const product = i.product as Product; // assert populated
      totalUSD += product.priceUSD * i.quantity;
    }

    let currency = 'USD';
    let totalToPay = totalUSD;

    if (method === 'mpesa') {
      totalToPay = convertUSDToKES(totalUSD);
      currency = 'KES';
    }

    // 3️⃣ Prepare order items
    const orderItems = cart.items.map((i) => {
      const product = i.product as Product;
      return {
        product: new Types.ObjectId(product._id as unknown as string),
        quantity: i.quantity,
        priceUSD: product.priceUSD,
      };
    });

    // 4️⃣ Create order
    const order = await this.ordersService.createOrder(
      userId,
      orderItems,
      totalToPay,
      method,
      shippingAddress as ShippingAddressDto,

    );

    console.log('Created order:', order);

    await this.cartService.clearCart(userId);

    // 5️⃣ Handle payment
    let paymentResponse: any;
    const orderIdString = (order._id as unknown as Types.ObjectId).toString();

    switch (method) {
      case 'mpesa':
        if (!phoneNumber) throw new Error('Phone number is required for Mpesa');
        paymentResponse = await this.mpesa.initiatePayment(
          phoneNumber,
          totalToPay,
          orderIdString,
        );
        break;

      case 'stripe':
        if (!email) throw new Error('Email is required for Stripe');
        paymentResponse = await this.stripe.createPaymentIntent(
          orderIdString,
          totalToPay,
          email,
        );
        break;

      case 'paypal':
        paymentResponse = await this.paypal.createOrder(orderIdString, totalToPay);
        break;

      default:
        throw new Error('Unsupported payment method');
    }

    // 6️⃣ Return order summary
    return {
      orderId: orderIdString,
      method,
      currency,
      totalToPay,
      paymentResponse,
      status: 'pending',
    };
  }

  /**
   * Confirms payment callback
   */
  async confirmPayment(
    orderId: string,
    result: { success: boolean; transactionId?: string; reason?: string },
  ) {
    if (result.success) {
      if (!result.transactionId)
        throw new Error('Transaction ID missing for successful payment');
      return this.ordersService.markAsPaid(orderId, result.transactionId);
    } else {
      return this.ordersService.failPayment(
        orderId,
        result.reason ?? 'Unknown error',
      );
    }
  }
}
