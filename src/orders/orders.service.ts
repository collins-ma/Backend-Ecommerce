import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order } from './schema/order.schema';
import { Cart } from 'src/cart/schema/cart.schema';
import { Product } from 'src/products/schema/product.schema';
import { CheckoutMethod } from './enums/checkout-method.enum';
import { PaymentStatus } from './enums/payment-status.enum';
import { OrderStatus } from './enums/order-status.enum';
import { ShippingAddress } from './schema/shipping-address.schema';
import { PaymentChannel } from './enums/payment-channel.enum';
import { CompleteRefundDto } from './dto/complete-refund.dto';
import { RefundChannel } from './enums/refund-channel.enum';
@Injectable()
export class OrderService {
  constructor(@InjectModel(Order.name) private orderModel: Model<Order>, @InjectModel(Cart.name) private cartModel: Model<Cart>, ) {}
async createOrder(
  userId: string,
  checkoutMethod: CheckoutMethod,
  shippingAddress: ShippingAddress,
) {
  
  const cart = await this.cartModel
    .findOne({ user: new Types.ObjectId(userId) })
    .populate('items.product');

  if (!cart || cart.items.length === 0) {
    throw new BadRequestException('Cart is empty');
  }

 
  cart.items = cart.items.filter(item => item.product);

  
  const orderItems = cart.items.map(item => {
    const product = item.product as Product;

    return {
      product: product._id,
      quantity: item.quantity,
      priceksh: product.priceKsh,
    };
  });

  const total = orderItems.reduce(
    (sum, item) => sum + item.priceksh * item.quantity,
    0,
  );

  
const order = new this.orderModel({
  user: new Types.ObjectId(userId),
  items: orderItems,
  total,

  checkoutMethod,

  paymentStatus: PaymentStatus.PENDING,

  orderStatus: OrderStatus.PENDING,

  shippingAddress,
});
 
  await order.save();

  

  return order;
}


async findByUser(userId: string) {
  return this.orderModel
    .find({
      user: new Types.ObjectId(userId),
    })
    .populate(
      'items.product',
      'name priceKsh image',
    )
    .sort({
      createdAt: -1,
    })
    .lean();
}
async findAll() {
  return this.orderModel
    .find()
    .populate(
  'user',
  'username email phoneNumber'
)
    .populate(
      'items.product',
      'name priceKsh image',
    )
    .sort({
      createdAt: -1,
    })
    .lean();
}
  
async findById(orderId: string) {

  const order = await this.orderModel
    .findById(orderId)
    .populate(
      'items.product',
      'name priceKsh image'
    )
    .populate(
      'user',
      'username email phoneNumber'
    );


  if (!order) {
    throw new NotFoundException(
      'Order not found'
    );
  }


  
  return order;
}
  async recordMpesaPayment(
  orderId: string,
  transactionId: string,
) {
  const order = await this.orderModel.findById(orderId);

  if (!order) {
    throw new NotFoundException('Order not found.');
  }

  // Only Cash on Delivery orders
  if (
    order.checkoutMethod !==CheckoutMethod. CASH_ON_DELIVERY
  ) {
    throw new BadRequestException(
      'M-Pesa payment can only be recorded for Cash on Delivery orders.',
    );
  }

  // Must already be shipped
  if (order.orderStatus !== OrderStatus.SHIPPED) {
    throw new BadRequestException(
      'The order must be shipped before recording payment.',
    );
  }

  // Prevent duplicate payment
  if (order.paymentStatus === PaymentStatus.PAID) {
    throw new BadRequestException(
      'This order has already been paid.',
    );
  }

  if (!transactionId?.trim()) {
    throw new BadRequestException(
      'Transaction ID is required.',
    );
  }

  order.paymentStatus = PaymentStatus.PAID;

  // Actual payment channel
  order.paymentChannel = PaymentChannel.MPESA;

  order.transactionId = transactionId.trim();

  order.paidAt = new Date();

  await order.save();

  return order;
}

  
async updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
) {
  const order = await this.orderModel.findById(orderId);

  if (!order) {
    throw new NotFoundException('Order not found.');
  }

  // M-Pesa orders must be paid before processing
  if (
    order.checkoutMethod ===CheckoutMethod.MPESA &&
    order.paymentStatus !== PaymentStatus.PAID &&
    newStatus !== OrderStatus.CANCELLED
  ) {
    throw new BadRequestException(
      'Payment has not been completed.',
    );
  }

  

  const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.PENDING]: [
      OrderStatus.CONFIRMED,
      OrderStatus.CANCELLED,
    ],

    [OrderStatus.CONFIRMED]: [
      OrderStatus.PROCESSING,
      OrderStatus.CANCELLED,
    ],

    [OrderStatus.PROCESSING]: [
      OrderStatus.SHIPPED,
    ],

    [OrderStatus.SHIPPED]: [
      OrderStatus.DELIVERED,
    ],

    [OrderStatus.DELIVERED]: [],

    [OrderStatus.CANCELLED]: [],
  };

  const allowed = allowedTransitions[order.orderStatus];

  if (!allowed.includes(newStatus)) {
    throw new BadRequestException(
      `Cannot change order status from ${order.orderStatus} to ${newStatus}.`,
    );
  }

  order.orderStatus = newStatus;

  switch (newStatus) {
    case OrderStatus.CONFIRMED:
      order.confirmedAt = new Date();
      break;

    case OrderStatus.PROCESSING:
      order.processingAt = new Date();
      break;

    case OrderStatus.SHIPPED:
      order.shippedAt = new Date();
      break;

    case OrderStatus.DELIVERED:
      order.deliveredAt = new Date();
      break;

    case OrderStatus.CANCELLED:
      order.cancelledAt = new Date();
      break;
  }

  await order.save();

  return order;
}    

async completeRefund(
  orderId: string,
  dto: CompleteRefundDto,
) {
  const order = await this.orderModel.findById(orderId);

  if (!order) {
    throw new NotFoundException('Order not found.');
  }

  // Only paid orders can be refunded
  if (order.paymentStatus !== PaymentStatus.REFUND_PENDING) {
    throw new BadRequestException(
      'This order is not awaiting a refund.',
    );
  }

  
  if (
  order.orderStatus !== OrderStatus.CANCELLED &&
  order.orderStatus !== OrderStatus.DELIVERED
) {
  throw new BadRequestException(
    'Only cancelled or returned (delivered) orders can be refunded.',
  );
}

  // M-Pesa refunds require a transaction reference
  if (
    dto.refundChannel === RefundChannel.MPESA &&
    !dto.transactionId
  ) {
    throw new BadRequestException(
      'Refund transaction ID is required for M-Pesa refunds.',
    );
  }

  order.paymentStatus = PaymentStatus.REFUNDED;

  order.refundChannel = dto.refundChannel;

  order.refundTransactionId = dto.transactionId;

  order.refundedAt = new Date();

  await order.save();

  return {
    message: 'Refund completed successfully.',
    order,
  };
}
  async markAsPaid(
  orderId: string,
  transactionId?: string,
) {
  const order = await this.orderModel.findById(orderId);

  if (!order) {
    throw new NotFoundException('Order not found');
  }

  order.paymentStatus = PaymentStatus.PAID;

  if (transactionId) {
    order.transactionId = transactionId;
  }

  return order.save();
}  


async recordCashPayment(orderId: string) {
  const order = await this.orderModel.findById(orderId);

  if (!order) {
    throw new NotFoundException('Order not found.');
  }

  // Only Cash on Delivery orders
  if (
    order.checkoutMethod !== CheckoutMethod.CASH_ON_DELIVERY
  ) {
    throw new BadRequestException(
      'Cash payment can only be recorded for Cash on Delivery orders.',
    );
  }

  
  if (order.orderStatus !== OrderStatus.DELIVERED) {
  throw new BadRequestException(
    'The order must be delivered before recording payment.',
  );
}

  // Prevent duplicate payment
  if (order.paymentStatus === PaymentStatus.PAID) {
    throw new BadRequestException(
      'This order has already been paid.',
    );
  }

  order.paymentStatus = PaymentStatus.PAID;

  // Actual payment channel used
  order.paymentChannel = PaymentChannel.CASH;

  order.paidAt = new Date();

  await order.save();

  return order;
}

async cancelOrder(
  orderId: string,
  reason?: string,
) {
  const order = await this.orderModel.findById(orderId);

  if (!order) {
    throw new NotFoundException(
      'Order not found.',
    );
  }

  if (
    order.orderStatus !== OrderStatus.PENDING &&
    order.orderStatus !== OrderStatus.CONFIRMED
  ) {
    throw new BadRequestException(
      `Cannot cancel an order that is ${order.orderStatus}.`,
    );
  }

  order.orderStatus = OrderStatus.CANCELLED;

  order.cancelledAt = new Date();

  if (reason?.trim()) {
    order.cancellationReason = reason.trim();
  }

  // Customer already paid
  if (
    order.paymentStatus === PaymentStatus.PAID
  ) {
    order.paymentStatus =
      PaymentStatus.REFUND_PENDING;

    order.refundRequestedAt =
      new Date();
  }

  await order.save();

  return order;
}
 
async failPayment(orderId: string, reason: string) {
  const order = await this.orderModel.findById(orderId);

  if (!order) {
    throw new NotFoundException('Order not found');
  }

  if (order.paymentStatus === PaymentStatus.PAID) {
    throw new BadRequestException('Order has already been paid.');
  }

  order.paymentStatus = PaymentStatus.FAILED;
  order.failureReason = reason;

  return order.save();
}






  async getOrderStatus(orderId: string, userId: string) {
    const order = await this.orderModel.findOne({ _id: orderId, user: new Types.ObjectId(userId) });
    if (!order) throw new NotFoundException('Order not found');
    return { status: order.paymentStatus };
  }
}