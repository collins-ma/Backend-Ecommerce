import { RefundChannel } from "../enums/refund-channel.enum";
import { IsEnum,IsString,IsOptional } from "class-validator";
export class CompleteRefundDto {

   @IsEnum(RefundChannel)
   refundChannel!: RefundChannel;

   @IsOptional()
   @IsString()
   transactionId?: string;
}