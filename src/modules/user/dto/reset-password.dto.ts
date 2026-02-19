import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  @IsNotEmpty({ message: 'Email address is required.' })
  email: string;

  @IsNotEmpty({ message: 'Verification code is required.' })
  otp: string;

  @IsNotEmpty({ message: 'A new password is required.' })
  @MinLength(8, { message: 'Your new password must be at least 8 characters long.' })
  newPassword: string;
}
