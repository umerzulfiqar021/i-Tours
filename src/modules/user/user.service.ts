import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/User.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { SigninUserDto } from './dto/signin-user.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  // Step 1: Initiate signup - send OTP
  async initiateSignup(createUserDto: CreateUserDto): Promise<{ message: string; email: string }> {
    const { email, firstName } = createUserDto;
    
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException(
        'This email address is already registered. Please use a different email or login to your existing account.',
      );
    }

    // Generate OTP
    const otp = this.emailService.generateOTP();

    // Store OTP and pending user data in cache
    await this.emailService.storeOTP(email, otp);
    await this.emailService.storePendingUser(email, createUserDto);

    // Send OTP email with user's first name
    const emailSent = await this.emailService.sendOTPEmail(email, otp, firstName);
    if (!emailSent) {
      throw new BadRequestException('Failed to send verification email. Please try again.');
    }

    return {
      message: 'Verification code sent to your email. Please check your inbox.',
      email: email,
    };
  }

  // Step 2: Verify OTP and create user
  async verifyOtpAndCreateUser(verifyOtpDto: VerifyOtpDto): Promise<{ user: Partial<User>; accessToken: string; message: string }> {
    const { email, otp } = verifyOtpDto;

    // Verify OTP
    const isValid = await this.emailService.verifyOTP(email, otp);
    if (!isValid) {
      throw new BadRequestException('Invalid or expired verification code. Please request a new one.');
    }

    // Get pending user data
    const pendingUserData = await this.emailService.getPendingUser(email);
    if (!pendingUserData) {
      throw new BadRequestException('Registration session expired. Please start the signup process again.');
    }

    // Create user
    const user = this.userRepository.create(pendingUserData as CreateUserDto);
    const savedUser = await this.userRepository.save(user) as User;

    // Clean up cache
    await this.emailService.deleteOTP(email);
    await this.emailService.deletePendingUser(email);

    // Generate JWT token
    const payload = { email: savedUser.email, sub: savedUser.id };
    const accessToken = this.jwtService.sign(payload);

    const { password: _, ...userWithoutPassword } = savedUser;

    return { 
      user: userWithoutPassword, 
      accessToken,
      message: `Welcome to i-Tours, ${savedUser.firstName || 'Traveler'}! Your account has been created successfully.`
    };
  }

  // Resend OTP
  async resendOtp(resendOtpDto: ResendOtpDto): Promise<{ message: string }> {
    const { email } = resendOtpDto;

    // Check if there's pending user data
    const pendingUserData = await this.emailService.getPendingUser(email);
    if (!pendingUserData) {
      throw new BadRequestException('No pending registration found. Please start the signup process again.');
    }

    // Generate new OTP
    const otp = this.emailService.generateOTP();

    // Store new OTP
    await this.emailService.storeOTP(email, otp);

    // Send OTP email
    const emailSent = await this.emailService.sendOTPEmail(email, otp);
    if (!emailSent) {
      throw new BadRequestException('Failed to send verification email. Please try again.');
    }

    return { message: 'New verification code sent to your email.' };
  }

  async signin(
    signinUserDto: SigninUserDto,
  ): Promise<{ user: Partial<User>; accessToken: string }> {
    const { email, password } = signinUserDto;
    const user = await this.userRepository.findOne({
      where: { email },
    });
    if (!user) {
      throw new UnauthorizedException(
        'User not found. Please check your email or create a new account.',
      );
    }
    if (user.password !== password) {
      throw new UnauthorizedException(
        'Incorrect password. Please try again or reset your password.',
      );
    }

    const payload = { email: user.email, sub: user.id };
    const accessToken = this.jwtService.sign(payload);

    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, accessToken };
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(
        'User not found. The account may have been deleted or does not exist.',
      );
    }
    return user;
  }
}
