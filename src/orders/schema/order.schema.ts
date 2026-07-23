import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

import {
  ShippingAddress,
  ShippingAddressSchema,
} from './shipping-address.schema';

import { CheckoutMethod } from '../enums/checkout-method.enum';
import { PaymentChannel } from '../enums/payment-channel.enum';
import { RefundChannel } from '../enums/refund-channel.enum';
import { PaymentStatus } from '../enums/payment-status.enum';
import { OrderStatus } from '../enums/order-status.enum';

@Schema({ timestamps: true })
export class Order extends Document {
  // ==========================
  // Customer
  // ==========================

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  user!: Types.ObjectId;

  // ==========================
  // Ordered Items
  // ==========================

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

  // ==========================
  // Order Total
  // ==========================

  @Prop({
    required: true,
    min: 0,
  })
  total!: number;

  // ==========================
  // Checkout Method
  // Customer selected at checkout
  // MPESA or CASH_ON_DELIVERY
  // ==========================

  @Prop({
    type: String,
    enum: CheckoutMethod,
    required: true,
  })
  checkoutMethod!: CheckoutMethod;

  // ==========================
  // Payment Channel
  // How payment was actually received
  // CASH or MPESA
  // ==========================

  @Prop({
    type: String,
    enum: PaymentChannel,
  })
  paymentChannel?: PaymentChannel;

  // ==========================
  // Payment Status
  // ==========================

  @Prop({
    type: String,
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  paymentStatus!: PaymentStatus;

  // ==========================
  // Order Status
  // ==========================

  @Prop({
    type: String,
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  orderStatus!: OrderStatus;

  // ==========================
  // Payment Information
  // ==========================

  @Prop()
  transactionId?: string;

  @Prop()
  paidAt?: Date;

  @Prop()
  failureReason?: string;

  // ==========================
  // Refund Information
  // ==========================

  @Prop({
    type: String,
    enum: RefundChannel,
  })
  refundChannel?: RefundChannel;

  @Prop()
  refundTransactionId?: string;

  @Prop()
  refundRequestedAt?: Date;

  @Prop()
  refundedAt?: Date;

  // ==========================
  // Shipping Address
  // ==========================

  @Prop({
    type: ShippingAddressSchema,
    required: true,
  })
  shippingAddress!: ShippingAddress;

  // ==========================
  // Courier Tracking
  // ==========================

  @Prop()
  trackingNumber?: string;

  // ==========================
  // Order Timeline
  // ==========================

  @Prop()
  confirmedAt?: Date;

  @Prop()
  processingAt?: Date;

  @Prop()
  shippedAt?: Date;

  @Prop()
  deliveredAt?: Date;

  @Prop()
  cancelledAt?: Date;

  // ==========================
  // Cancellation
  // ==========================

  @Prop()
  cancellationReason?: string;

  // ==========================
  // Returns
  // (We'll use this when integrating
  // the Returns module.)
  // ==========================

  // @Prop({
  //   type: String,
  //   enum: ReturnStatus,
  // })
  // returnStatus?: ReturnStatus;
}

export const OrderSchema = SchemaFactory.createForClass(Order);