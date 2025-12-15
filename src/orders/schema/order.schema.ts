// src/orders/order.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ShippingAddress, ShippingAddressSchema } from './shipping-address.schema';
import { Product } from 'src/products/schema/product.schema';

@Schema({ timestamps: true })
export class Order extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop([
    {
      product: { type: Types.ObjectId, ref: 'Product', required: true },
      quantity: { type: Number, required: true },
      priceUSD: { type: Number, required: true },
    },
  ])
  items: { product: Types.ObjectId; quantity: number; priceUSD: number }[];

  @Prop({ required: true })
  total: number;

  @Prop()
  transactionId?: string;

  @Prop()
  failureReason?: string;

  @Prop({ default: 'pending' })
  status: 'pending' | 'paid' | 'failed';

  @Prop({ required: true })
  paymentMethod: 'mpesa' | 'stripe' | 'paypal';

  @Prop({ type: ShippingAddressSchema, required: true })
  shippingAddress: ShippingAddress;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
