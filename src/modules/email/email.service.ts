import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASSWORD'),
      },
    });
  }

  // Generate 6-digit OTP
  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Store OTP in cache with expiry
  async storeOTP(email: string, otp: string): Promise<void> {
    const expiryMinutes = this.configService.get('OTP_EXPIRY_MINUTES') || 10;
    const ttl = expiryMinutes * 60 * 1000; // Convert to milliseconds
    await this.cacheManager.set(`otp:${email}`, otp, ttl);
  }

  // Get OTP from cache
  async getOTP(email: string): Promise<string | undefined> {
    return await this.cacheManager.get<string>(`otp:${email}`);
  }

  // Delete OTP from cache
  async deleteOTP(email: string): Promise<void> {
    await this.cacheManager.del(`otp:${email}`);
  }

  // Store pending user data temporarily
  async storePendingUser(email: string, userData: any): Promise<void> {
    const expiryMinutes = this.configService.get('OTP_EXPIRY_MINUTES') || 10;
    const ttl = expiryMinutes * 60 * 1000;
    await this.cacheManager.set(`pending:${email}`, userData, ttl);
  }

  // Get pending user data
  async getPendingUser(email: string): Promise<any> {
    return await this.cacheManager.get(`pending:${email}`);
  }

  // Delete pending user data
  async deletePendingUser(email: string): Promise<void> {
    await this.cacheManager.del(`pending:${email}`);
  }

  // Send OTP email
  async sendOTPEmail(
    email: string,
    otp: string,
    firstName?: string,
  ): Promise<boolean> {
    try {
      const fromEmail =
        this.configService.get('SMTP_FROM_EMAIL') || 'noreply@i-tours.com';
      const fromName = this.configService.get('SMTP_FROM_NAME') || 'i-Tours';
      const greeting = firstName ? `Hi ${firstName},` : 'Hi there,';
      const userName = firstName || 'there';

      await this.transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: email,
        subject: `${otp} is your i-Tours verification code`,
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
              <!-- Header with Gradient -->
              <tr>
                <td style="background: linear-gradient(135deg, #FF6B35 0%, #FF8C61 50%, #FFB088 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 36px; font-weight: 700; letter-spacing: 2px; text-shadow: 2px 2px 4px rgba(0,0,0,0.2);">✈️ i-Tours</h1>
                  <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 14px; letter-spacing: 1px;">Intelligent Destination Selection</p>
                </td>
              </tr>
              
              <!-- Main Content -->
              <tr>
                <td style="padding: 50px 40px; background-color: #ffffff;">
                  <h2 style="margin: 0 0 20px; color: #2d3748; font-size: 24px; font-weight: 600;">${greeting}</h2>
                  <p style="margin: 0 0 30px; color: #718096; font-size: 16px; line-height: 1.6;">
                    Thank you for signing up with <strong style="color: #FF6B35;">i-Tours</strong>! To complete your registration, please enter the verification code below:
                  </p>
                  
                  <!-- OTP Code Box -->
                  <div style="text-align: center; margin: 40px 0;">
                    <div style="display: inline-block; background: linear-gradient(145deg, #fff5f0 0%, #ffffff 100%); border: 3px solid #FF6B35; border-radius: 16px; padding: 25px 50px; box-shadow: 0 10px 40px rgba(255, 107, 53, 0.15);">
                      <span style="font-size: 42px; font-weight: 800; color: #FF6B35; letter-spacing: 12px; font-family: 'Courier New', monospace;">${otp}</span>
                    </div>
                  </div>
                  
                  <!-- Timer Warning -->
                  <div style="text-align: center; margin: 30px 0;">
                    <p style="display: inline-block; background-color: #fff5f0; color: #c53030; font-size: 14px; padding: 12px 24px; border-radius: 25px; margin: 0;">
                      ⏰ This code expires in <strong>10 minutes</strong>
                    </p>
                  </div>
                  
                  <!-- Help Section -->
                  <div style="margin-top: 40px; padding: 25px; background-color: #f7fafc; border-radius: 12px; border-left: 4px solid #FF6B35;">
                    <p style="margin: 0; color: #4a5568; font-size: 14px; line-height: 1.6;">
                      <strong>Need help?</strong> If you didn't request this verification code, you can safely ignore this email. Someone may have entered your email by mistake.
                    </p>
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #2d3748; padding: 40px 30px; border-radius: 0 0 12px 12px;">
                  <!-- Social Links -->
                  <div style="text-align: center; margin-bottom: 25px;">
                    <a href="#" style="display: inline-block; margin: 0 8px; width: 40px; height: 40px; background-color: #4a5568; border-radius: 50%; line-height: 40px; text-decoration: none;">
                      <img src="https://img.icons8.com/ios-filled/24/ffffff/facebook-new.png" alt="Facebook" style="vertical-align: middle;">
                    </a>
                    <a href="#" style="display: inline-block; margin: 0 8px; width: 40px; height: 40px; background-color: #4a5568; border-radius: 50%; line-height: 40px; text-decoration: none;">
                      <img src="https://img.icons8.com/ios-filled/24/ffffff/instagram-new.png" alt="Instagram" style="vertical-align: middle;">
                    </a>
                    <a href="#" style="display: inline-block; margin: 0 8px; width: 40px; height: 40px; background-color: #4a5568; border-radius: 50%; line-height: 40px; text-decoration: none;">
                      <img src="https://img.icons8.com/ios-filled/24/ffffff/twitter.png" alt="Twitter" style="vertical-align: middle;">
                    </a>
                    <a href="#" style="display: inline-block; margin: 0 8px; width: 40px; height: 40px; background-color: #4a5568; border-radius: 50%; line-height: 40px; text-decoration: none;">
                      <img src="https://img.icons8.com/ios-filled/24/ffffff/linkedin.png" alt="LinkedIn" style="vertical-align: middle;">
                    </a>
                  </div>
                  
                  <!-- Company Info -->
                  <div style="text-align: center; color: #a0aec0; font-size: 13px; line-height: 1.8;">
                    <p style="margin: 0 0 10px;">
                      <strong style="color: #ffffff;">i-Tours Technologies</strong>
                    </p>
                    <p style="margin: 0 0 5px;">
                      📍 Paris Road, Near Allama Iqbal Stadium, Sialkot 51310, Punjab, Pakistan
                    </p>
                    <p style="margin: 0 0 15px;">
                      📞 +92 307 9629399 &nbsp; | &nbsp; ✉️ support@i-tours.com
                    </p>
                  </div>
                  
                  <!-- Divider -->
                  <div style="border-top: 1px solid #4a5568; margin: 20px 0;"></div>
                  
                  <!-- Legal Links -->
                  <div style="text-align: center; margin-bottom: 15px;">
                    <a href="#" style="color: #a0aec0; text-decoration: none; font-size: 12px; margin: 0 10px;">Privacy Policy</a>
                    <span style="color: #4a5568;">|</span>
                    <a href="#" style="color: #a0aec0; text-decoration: none; font-size: 12px; margin: 0 10px;">Terms of Service</a>
                    <span style="color: #4a5568;">|</span>
                    <a href="#" style="color: #a0aec0; text-decoration: none; font-size: 12px; margin: 0 10px;">Unsubscribe</a>
                  </div>
                  
                  <!-- Copyright -->
                  <p style="text-align: center; color: #718096; font-size: 12px; margin: 0;">
                    © 2025 i-Tours. All rights reserved.
                  </p>
                  <p style="text-align: center; color: #718096; font-size: 11px; margin: 10px 0 0;">
                    This email was sent to ${email}
                  </p>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
        text: `Hi ${userName},

Welcome to i-Tours - Intelligent Destination Selection!

Your verification code is: ${otp}

This code will expire in 10 minutes. Please enter it in the app to complete your registration.

If you didn't request this code, please ignore this email.

---
i-Tours Technologies
Paris Road, Near Allama Iqbal Stadium
Sialkot 51310, Punjab, Pakistan
Phone: +92 307 9629399
Email: support@i-tours.com

© 2025 i-Tours. All rights reserved.`,
      });

      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  // Verify OTP
  async verifyOTP(email: string, otp: string): Promise<boolean> {
    const storedOTP = await this.getOTP(email);
    if (!storedOTP) {
      return false;
    }
    return storedOTP === otp;
  }
}
