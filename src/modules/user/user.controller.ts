import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from '../../database/entities/User.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { SigninUserDto } from './dto/signin-user.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Step 1: Initiate signup - sends OTP to email
  @Post('signup')
  initiateSignup(
    @Body() createUserDto: CreateUserDto,
  ): Promise<{ message: string; email: string }> {
    return this.userService.initiateSignup(createUserDto);
  }

  // Step 2: Verify OTP and complete registration
  @Post('verify-otp')
  verifyOtp(
    @Body() verifyOtpDto: VerifyOtpDto,
  ): Promise<{ user: Partial<User>; accessToken: string; message: string }> {
    return this.userService.verifyOtpAndCreateUser(verifyOtpDto);
  }

  // Resend OTP
  @Post('resend-otp')
  resendOtp(@Body() resendOtpDto: ResendOtpDto): Promise<{ message: string }> {
    return this.userService.resendOtp(resendOtpDto);
  }

  @Post('signin')
  signin(
    @Body() signinUserDto: SigninUserDto,
  ): Promise<{ user: Partial<User>; accessToken: string }> {
    return this.userService.signin(signinUserDto);
  }

  // Forgot Password Step 1: Request OTP
  @Post('forgot-password')
  forgotPassword(@Body('email') email: string): Promise<{ message: string }> {
    return this.userService.initiateForgotPassword(email);
  }

  // Forgot Password Step 2: Verify OTP and set New Password
  @Post('reset-password')
  resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    return this.userService.verifyOtpAndResetPassword(resetPasswordDto);
  }
}
