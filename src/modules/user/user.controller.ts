import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from '../../database/entities/User.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { SigninUserDto } from './dto/signin-user.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Step 1: Initiate signup - sends OTP to email
  @Post('signup')
  initiateSignup(@Body() createUserDto: CreateUserDto): Promise<{ message: string; email: string }> {
    return this.userService.initiateSignup(createUserDto);
  }

  // Step 2: Verify OTP and complete registration
  @Post('verify-otp')
  verifyOtp(@Body() verifyOtpDto: VerifyOtpDto): Promise<{ user: User; accessToken: string }> {
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
  ): Promise<{ user: User; accessToken: string }> {
    return this.userService.signin(signinUserDto);
  }

  @Get()
  findAll(): Promise<User[]> {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<User> {
    return this.userService.findOne(+id);
  }
}
