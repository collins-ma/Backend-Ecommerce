import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

import { ReturnStatus } from '../enums/return-status.enum';
import { RefundChannel } from '../../orders/enums/refund-channel.enum';

@Schema({
  timestamps: true,
})
export class Return extends Document {
  // ==========================
  // Related Order
  // ==========================

  @Prop({
    type: Types.ObjectId,
    ref: 'Order',
    required: true,
  })
  order!: Types.ObjectId;

  // ==========================
  // Customer
  // ==========================

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  customer!: Types.ObjectId;

  // ==========================
  // Why customer wants to return
  // ==========================

  @Prop({
    required: true,
    trim: true,
  })
  reason!: string;

  // ==========================
  // Return Status
  // ==========================

  @Prop({
    type: String,
    enum: ReturnStatus,
    default: ReturnStatus.REQUESTED,
  })
  status!: ReturnStatus;

  // ==========================
  // Approval
  // ==========================

  @Prop()
  approvedAt?: Date;

  // ==========================
  // Rejection
  // ==========================

  @Prop()
  rejectedAt?: Date;

  @Prop()
  rejectedReason?: string;

  // ==========================
  // Internal notes
  // ==========================

  @Prop()
  adminNotes?: string;

  // ==========================
  // Item received
  // ==========================

  @Prop()
  itemReceivedAt?: Date;

  // ==========================
  // Refund
  // ==========================

  @Prop({
    type: String,
    enum: RefundChannel,
  })
  refundChannel?: RefundChannel;

  @Prop()
  refundTransactionId?: string;

  @Prop()
  refundedAt?: Date;
}

export const ReturnSchema =
  SchemaFactory.createForClass(Return);