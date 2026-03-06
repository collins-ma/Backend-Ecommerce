import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class PaymentMapping extends Document {
  @Prop({ required: true })
  orderId: Types.ObjectId;

  @Prop({ required: true })
  checkoutRequestId: string;
}

export const PaymentMappingSchema = SchemaFactory.createForClass(PaymentMapping);