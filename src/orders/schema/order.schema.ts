import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  ShippingAddress,
  ShippingAddressSchema,
} from './shipping-address.schema';

import { PaymentMethod } from '../enums/payment-method.enum';
import { PaymentStatus } from '../enums/payment-status.enum';
import { OrderStatus } from '../enums/order-status.enum';

@Schema({ timestamps: true })
export class Order extends Document {
  // Customer
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  user!: Types.ObjectId;

  // Products in the order
  @Prop([
    {
      product: {
        type: Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
      priceksh: {
        type: Number,
        required: true,
        min: 0,
      },
    },
  ])
  items!: {
    product: Types.ObjectId;
    quantity: number;
    priceksh: number;
  }[];

  // Total amount
  @Prop({
    required: true,
    min: 0,
  })
  total!: number;

  // Payment method
  @Prop({
    type: String,
    enum: PaymentMethod,
    required: true,
  })
  paymentMethod!: PaymentMethod;

  // Payment status
  @Prop({
    type: String,
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  paymentStatus!: PaymentStatus;

  // Order status
  @Prop({
    type: String,
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  orderStatus!: OrderStatus;

  // Payment transaction reference
  @Prop()
  transactionId?: string;

  // Payment failure reason
  @Prop()
  failureReason?: string;

  // Shipping address
  @Prop({
    type: ShippingAddressSchema,
    required: true,
  })
  shippingAddress!: ShippingAddress;

  // Courier tracking number
  @Prop()
  trackingNumber?: string;

  // Cancellation details
  @Prop()
  cancelledAt?: Date;

  @Prop()
  cancellationReason?: string;

  // Delivery timestamp
  @Prop()
  deliveredAt?: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);