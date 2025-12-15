import { IsMongoId, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  image: string;

  @IsNumber()
  @Min(0)
  priceUSD: number;

  @IsMongoId()
  @IsNotEmpty()
  category: string; // references Category _id
}
