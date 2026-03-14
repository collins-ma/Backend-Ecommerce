import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order } from './schema/order.schema';
import { Cart } from 'src/cart/schema/cart.schema';
import { Product } from 'src/products/schema/product.schema';

@Injectable()
export class OrderService {
  constructor(@InjectModel(Order.name) private orderModel: Model<Order>, @InjectModel(Cart.name) private cartModel: Model<Cart>, ) {}

  async createOrder(
  userId: string,
  Items:any[],
  totalKsh: number,

  shippingAddress: any,
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
    paymentMethod: 'mpesa',
    shippingAddress,
    status: 'pending',
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

  async updateStatus(orderId: string, status: 'pending' | 'paid' | 'failed') {
    const updated = await this.orderModel.findByIdAndUpdate(orderId, { status }, { new: true });
    if (!updated) throw new NotFoundException('Order not found');
    return updated;
  }

  async markAsPaid(orderId: string, transactionId: string) {
    const order = await this.orderModel.findById(orderId);
    if (!order) throw new NotFoundException('Order not found');
    order.status = 'paid';
    order.transactionId = transactionId;
    return order.save();
  }

  async failPayment(orderId: string, reason: string) {
    const order = await this.orderModel.findById(orderId);
    console.log(order)
    if (!order) throw new NotFoundException('Order not found');
    order.status = 'failed';
    order.failureReason = reason;
    return order.save();
  }

 

  async getOrderStatus(orderId: string, userId: string) {
    const order = await this.orderModel.findOne({ _id: orderId, user: new Types.ObjectId(userId) });
    if (!order) throw new NotFoundException('Order not found');
    return { status: order.status };
  }
}