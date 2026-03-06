import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Schema as MongooseSchema } from 'mongoose';
@Schema({ timestamps: true })
export class Session extends Document {
  @Prop({ required: true })
  sessionId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: string;

  @Prop({ required: true })
  refreshToken: string;

  @Prop()
  userAgent: string;

  @Prop()
  ipAddress: string;

  @Prop({ required: true })
  expiresAt: Date; 
}

export const SessionSchema = SchemaFactory.createForClass(Session);