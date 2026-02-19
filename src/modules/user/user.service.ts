import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/User.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { SigninUserDto } from './dto/signin-user.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Step 1: Initiates the signup process by validating the user and sending a verification OTP.
   * 
   * @param createUserDto User registration details
   * @returns Success message and the email used
   */
  async initiateSignup(createUserDto: CreateUserDto): Promise<{ message: string; email: string }> {
    const { email, firstName } = createUserDto;
    
    // Check if a user with this email already exists in our records
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException(
        'An account with this email address already exists. Please try logging in or use a different email.',
      );
    }

    // Generate a secure One-Time Password (OTP) for email verification
    const otp = this.emailService.generateOTP();

    // Securely cache the OTP and pending user details for verification in the next step
    await this.emailService.storeOTP(email, otp);
    await this.emailService.storePendingUser(email, createUserDto);

    // Dispatch the verification email
    const isEmailSent = await this.emailService.sendOTPEmail(email, otp, firstName);
    if (!isEmailSent) {
      this.logger.error(`Failed to send verification email to: ${email}`);
      throw new BadRequestException('We encountered an issue sending your verification email. Please try again in a few moments.');
    }

    return {
      message: 'A verification code has been sent to your email. Please check your inbox to continue.',
      email: email,
    };
  }

  /**
   * Step 2: Validates the OTP and completes the user registration process.
   * 
   * @param verifyOtpDto OTP and email for verification
   * @returns Created user profile, access token, and welcome message
   */
  async verifyOtpAndCreateUser(verifyOtpDto: VerifyOtpDto): Promise<{ user: Partial<User>; accessToken: string; message: string }> {
    const { email, otp } = verifyOtpDto;

    // Validate the provided OTP against our cached record
    const isOtpValid = await this.emailService.verifyOTP(email, otp);
    if (!isOtpValid) {
      throw new BadRequestException('The verification code is invalid or has expired. Please request a new code.');
    }

    // Retrieve the user registration data matching this session
    const pendingUserData = await this.emailService.getPendingUser(email);
    if (!pendingUserData) {
      throw new BadRequestException('Your registration session has timed out. Please restart the signup process.');
    }

    // Persist the user to the database
    const userEntity = this.userRepository.create(pendingUserData as CreateUserDto);
    const savedUser = await this.userRepository.save(userEntity) as User;

    // Clean up temporary session data
    await this.emailService.deleteOTP(email);
    await this.emailService.deletePendingUser(email);

    // Issue a JWT for immediate access
    const payload = { email: savedUser.email, sub: savedUser.id };
    const accessToken = this.jwtService.sign(payload);

    // Omit sensitive data like password from the response
    const { password: _, ...userProfile } = savedUser;

    return { 
      user: userProfile, 
      accessToken,
      message: `Welcome to i-Tours, ${savedUser.firstName || 'Traveler'}! Your account is ready for your next adventure.`
    };
  }

  /**
   * Resends a verification OTP for a pending registration.
   */
  async resendOtp(resendOtpDto: ResendOtpDto): Promise<{ message: string }> {
    const { email } = resendOtpDto;

    // Verify that there is an active registration session for this email
    const pendingUserData = await this.emailService.getPendingUser(email);
    if (!pendingUserData) {
      throw new BadRequestException('No active registration session found. Please start the signup process again.');
    }

    // Refresh the OTP and update the cache
    const newOtp = this.emailService.generateOTP();
    await this.emailService.storeOTP(email, newOtp);

    // Resend the email notification
    const isEmailSent = await this.emailService.sendOTPEmail(email, newOtp);
    if (!isEmailSent) {
      this.logger.error(`Failed to resend verification email to: ${email}`);
      throw new BadRequestException('Failed to deliver the verification code. Please try again.');
    }

    return { message: 'A fresh verification code has been dispatched to your email.' };
  }

  /**
   * Authenticates a user and returns a session token.
   */
  async signin(
    signinUserDto: SigninUserDto,
  ): Promise<{ user: Partial<User>; accessToken: string }> {
    const { email, password } = signinUserDto;
    
    // Look up the user by email
    const user = await this.userRepository.findOne({
      where: { email },
    });
    
    if (!user) {
      throw new UnauthorizedException('Authentication failed. Please verify your email and password.');
    }

    // Validate the password
    // NOTE: In a production environment, always use hashed passwords (e.g., bcrypt)
    if (user.password !== password) {
      throw new UnauthorizedException('Authentication failed. Please verify your email and password.');
    }

    // Generate session token
    const payload = { email: user.email, sub: user.id };
    const accessToken = this.jwtService.sign(payload);

    const { password: _, ...userProfile } = user;
    return { user: userProfile, accessToken };
  }

  /**
   * Retrieves a specific user's public profile details.
   */
  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException('Requested user profile could not be found.');
    }
    return user;
  }

  /**
   * Initiates the forgot password process by sending an OTP to the user's email.
   * Uses the same secure OTP logic as the signup process.
   * 
   * @param email The account email to reset
   * @returns Success message
   */
  async initiateForgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      // For security, we return the same message even if the user doesn't exist to prevent account enumeration
      this.logger.warn(`Password reset attempt for non-existent email: ${email}`);
      return { message: 'If an account exists with this email, a verification code has been sent.' };
    }

    const otp = this.emailService.generateOTP();
    await this.emailService.storeOTP(email, otp);
    
    const isEmailSent = await this.emailService.sendOTPEmail(email, otp, user.firstName);
    if (!isEmailSent) {
      this.logger.error(`Failed to send password reset email to: ${email}`);
      throw new BadRequestException('We encountered an issue sending your reset code. Please try again in a few moments.');
    }

    return { message: 'A verification code has been sent to your email. Please check your inbox.' };
  }

  /**
   * Step 2: Verifies the reset OTP and updates the user's password.
   * 
   * @param resetPasswordDto Contains email, otp, and the new password
   * @returns Success message
   */
  async verifyOtpAndResetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { email, otp, newPassword } = resetPasswordDto;
    
    // Verify the OTP against the cache
    const isOtpValid = await this.emailService.verifyOTP(email, otp);
    if (!isOtpValid) {
      throw new BadRequestException('The verification code is invalid or has expired. Please request a new one.');
    }

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
       throw new NotFoundException('User profile not found. Please contact support if this persists.');
    }

    // Update the password
    // NOTE: For production, ensure passwords are encrypted using a library like bcrypt
    user.password = newPassword;
    await this.userRepository.save(user);

    // Clean up the OTP session
    await this.emailService.deleteOTP(email);

    return { message: 'Your password has been successfully reset. You can now securely log in with your new credentials.' };
  }
}
