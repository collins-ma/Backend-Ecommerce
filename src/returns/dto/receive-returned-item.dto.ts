import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ReceiveReturnedItemDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  adminNotes?: string;
}