import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectReturnDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  rejectedReason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  adminNotes?: string;
}