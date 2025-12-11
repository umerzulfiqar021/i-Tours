import { IsEmail, IsNotEmpty, IsObject, IsString } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsObject()
  preferences: any;
}
