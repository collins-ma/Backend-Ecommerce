import { PartialType } from '@nestjs/mapped-types';
import { AddToCartDto } from './add-to-cart.dto';
import { IsNumber, Min } from 'class-validator';

export class UpdateCartDto extends PartialType(AddToCartDto) {
  @IsNumber()
  @Min(1)
  quantity: number;
}
