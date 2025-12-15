import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Schema as MongooseSchema } from 'mongoose';
@Schema({ timestamps: true })
export class Session extends Document {
  @Prop({ required: true })
  sessionId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: string;// references User._id

  @Prop({ required: true })
  refreshToken: string;

  @Prop()
  userAgent: string;

  @Prop()
  ipAddress: string;

  @Prop({ required: true })
  expiresAt: Date; // same lifetime as refresh token
}

export const SessionSchema = SchemaFactory.createForClass(Session);