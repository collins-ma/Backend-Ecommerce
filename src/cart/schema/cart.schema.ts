// src/cart/schema/cart.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from 'src/users/user.schema';
import { Product } from 'src/products/schema/product.schema';

export type CartDocument = Cart & Document;

@Schema({ timestamps: true })
export class Cart extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: User | Types.ObjectId;

  @Prop([
    {
      product: { type: Types.ObjectId, ref: 'Product', required: true },
      quantity: { type: Number, required: true, min: 1 },
    },
  ])
  items: { product: Product | Types.ObjectId; quantity: number }[];

  @Prop({ type: Number, default: 0 })
  total: number;
}

export const CartSchema = SchemaFactory.createForClass(Cart);
