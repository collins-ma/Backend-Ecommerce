import {
  IsString,
  IsNotEmpty,
  IsEmail,
  Matches,
  isArray,
  isNotEmpty
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'Username is required' })
  readonly username: string;

  



  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  readonly email: string;

  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(/^\+?[0-9]{10,15}$/, {
    message: 'Phone number must contain only digits and optionally start with +',
  })
  readonly phoneNumber: string;
}
