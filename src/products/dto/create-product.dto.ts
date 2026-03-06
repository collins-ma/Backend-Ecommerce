import { IsMongoId, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  image?: string;

  @IsNumber()
  @Min(0)
  priceKsh: number;

  @IsMongoId()
  @IsNotEmpty()
  category: string;
}