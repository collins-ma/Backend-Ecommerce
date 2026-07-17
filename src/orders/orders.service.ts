import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order } from './schema/order.schema';
import { Cart } from 'src/cart/schema/cart.schema';
import { Product } from 'src/products/schema/product.schema';
import { PaymentMethod } from './enums/payment-method.enum';
import { PaymentStatus } from './enums/payment-status.enum';
import { OrderStatus } from './enums/order-status.enum';
import { ShippingAddress } from './schema/shipping-address.schema';
@Injectable()
export class OrderService {
  constructor(@InjectModel(Order.name) private orderModel: Model<Order>, @InjectModel(Cart.name) private cartModel: Model<Cart>, ) {}
async createOrder(
  userId: string,
  paymentMethod: PaymentMethod,
  shippingAddress: ShippingAddress,
) {
  
  const cart = await this.cartModel
    .findOne({ user: new Types.ObjectId(userId) })
    .populate('items.product');

  if (!cart || cart.items.length === 0) {
    throw new Error('Cart is empty');
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

  paymentMethod,

  paymentStatus: PaymentStatus.PENDING,

  orderStatus: OrderStatus.PENDING,

  shippingAddress,
});
 
  await order.save();

  

  return order;
}

  async findByUser(userId: string) {
    const usersOrder= await this.orderModel
      .find({ user: new Types.ObjectId(userId) })
      .populate('items.product', 'name priceKsh image')
      .sort({ createdAt: -1 });

      

      return usersOrder
  }

  async findAll() {
  return this.orderModel
    .find()
    
}

  async findById(orderId: string) {
    const order = await this.orderModel.findById(orderId).populate('items.product', 'name priceKsh image');
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
) {
  const order = await this.orderModel.findById(orderId);

  if (!order) {
    throw new NotFoundException('Order not found');
  }

  // Prevent processing unpaid M-Pesa orders
  if (
    order.paymentMethod === PaymentMethod.MPESA &&
    order.paymentStatus !== PaymentStatus.PAID &&
    newStatus !== OrderStatus.CANCELLED
  ) {
    throw new BadRequestException(
      'This order cannot be processed because payment has not been completed.',
    );
  }

  const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.PENDING]: [
      OrderStatus.CONFIRMED,
    ],

    [OrderStatus.CONFIRMED]: [
      OrderStatus.PROCESSING,
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

  const allowed =
    allowedTransitions[order.orderStatus];

  if (!allowed.includes(newStatus)) {
    throw new BadRequestException(
      `Cannot change order status from ${order.orderStatus} to ${newStatus}.`,
    );
  }

  order.orderStatus = newStatus;

  if (newStatus === OrderStatus.DELIVERED) {
    order.deliveredAt = new Date();
  }

  await order.save();

  return order;
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

 
async cancelOrder(
  orderId: string,
  userId: string,
  reason?: string,
) {
  const order = await this.orderModel.findOne({
    _id: orderId,
    user: new Types.ObjectId(userId),
  });

  if (!order) {
    throw new NotFoundException('Order not found');
  }

  // Only allow cancellation before the order starts processing
  if (
    order.orderStatus !== OrderStatus.PENDING &&
    order.orderStatus !== OrderStatus.CONFIRMED
  ) {
    throw new BadRequestException(
      `Order cannot be cancelled because it is currently ${order.orderStatus}.`,
    );
  }

  // Cancel the order
  order.orderStatus = OrderStatus.CANCELLED;
  order.cancelledAt = new Date();

  if (reason?.trim()) {
    order.cancellationReason = reason.trim();
  }

  // Handle payment status
  switch (order.paymentStatus) {
    case PaymentStatus.PAID:
      // Customer has already paid.
      // Admin should process the refund.
      order.paymentStatus = PaymentStatus.REFUND_PENDING;
      break;

    case PaymentStatus.PENDING:
    case PaymentStatus.FAILED:
      // Nothing to refund.
      break;

    case PaymentStatus.REFUND_PENDING:
    case PaymentStatus.REFUNDED:
      // Leave as is.
      break;
  }

  await order.save();

  return order;
}


  async getOrderStatus(orderId: string, userId: string) {
    const order = await this.orderModel.findOne({ _id: orderId, user: new Types.ObjectId(userId) });
    if (!order) throw new NotFoundException('Order not found');
    return { status: order.paymentStatus };
  }
}