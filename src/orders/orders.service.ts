import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order } from './schema/order.schema';
import { ShippingAddress } from './schema/shipping-address.schema';
import { Cart } from 'src/cart/schema/cart.schema';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Cart.name) private cartModel: Model<Cart>,
  ) {}

  // 🟢 CREATE - create a new order (used during checkout)
  async createOrder(
    userId: string,
   
    items: { product: Types.ObjectId; quantity: number; priceUSD: number }[],
    total: number,
    paymentMethod: 'mpesa' | 'stripe' | 'paypal',
    shippingAddress: ShippingAddress,
  ) {
    const order = new this.orderModel({
      user: new Types.ObjectId(userId), // ensure it's saved as 
      shippingAddress,
      items,
      total,
      paymentMethod,
      status: 'pending',
    });

    return order.save();
  }

  // 🔵 READ - get all orders (admin)
  async findAll() {
    return this.orderModel
      .find()
      .populate('items.product', 'name priceUSD') // populate only name and price
      .exec();
  }

  // 🟣 READ - get orders for a specific user

  async findByUser(userId: string) {
    return this.orderModel
      .find({ user: new Types.ObjectId(userId) })
      .populate('user', 'name email')
      .populate('items.product', 'name priceUSD image')
      .sort({ createdAt: -1 });
  }
   
  

  // 🟠 READ - get single order by ID
  async findById(orderId: string) {
    const order = await this.orderModel
      .findById(orderId)
      .populate('items.product', 'name priceUSD image');
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  // 🟡 UPDATE - update order status (admin or webhook)
  async updateStatus(id: string, status: 'pending' | 'paid' | 'failed') {
    const updatedOrder = await this.orderModel.findByIdAndUpdate(
      id,
      { status },             
      { new: true, runValidators: false }
    );

    if (!updatedOrder) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }

    return updatedOrder;
  }

  // 🔴 DELETE - delete an order
  async delete(orderId: string) {
    const order = await this.orderModel.findByIdAndDelete(orderId);
    if (!order) throw new NotFoundException('Order not found');
    return { message: 'Order deleted successfully' };
  }

  // ✅ CONFIRM PAYMENT - called when payment gateway confirms success
  async markAsPaid(orderId: string, transactionId: string) {
    const order = await this.orderModel.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    order.status = 'paid';
    (order as any).transactionId = transactionId; // optional

    return await order.save();
  }

  async failPayment(orderId: string, reason: string) {
    const order = await this.orderModel.findById(orderId);
    console.log('Failing payment for Order ID:', orderId, 'Reason:', reason);
    if (!order) throw new NotFoundException('Order not found');
  
    order.status = 'failed';
    (order as any).failureReason = reason;
  
    return await order.save();
  }
}
