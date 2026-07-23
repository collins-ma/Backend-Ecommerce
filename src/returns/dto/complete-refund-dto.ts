import {
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

import { RefundChannel } from '../../orders/enums/refund-channel.enum';

export class CompleteRefundDto {
  @IsEnum(RefundChannel)
  refundChannel!: RefundChannel;

  @IsOptional()
  @IsString()
  transactionId?: string;

  @IsOptional()
  @IsString()
  adminNotes?: string;
}