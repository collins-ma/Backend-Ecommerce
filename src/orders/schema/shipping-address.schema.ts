// src/orders/shipping-address.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class ShippingAddress {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  street: string;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  zip: string;

  @Prop()
  phone?: string;
}

export const ShippingAddressSchema = SchemaFactory.createForClass(ShippingAddress);
