import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class User extends Document {
  @Prop({ required: true })

  username: string;

  @Prop({ required: true })
  email: string;


  @Prop({ required: true  })
  password: string;

  @Prop({ unique: true }) 
  phoneNumber: string;

  @Prop()
  resetToken?: string;

  @Prop()
  resetTokenExpiry?: Date;

  @Prop({ type: [String], default: ['user'] })
  roles:[String]

  @Prop({default:false})
  isVerified:boolean;

  @Prop({ default: true })
  isActive: boolean;
  
  @Prop()

  verificationCode: string;

  @Prop({type:Date, default:null})
  verificationCodeExpires: Date|null;

  





}




export const UserSchema = SchemaFactory.createForClass(User);
