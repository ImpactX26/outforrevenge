import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto, ForgotPasswordDto, ResetPasswordDto } from './dto/login.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new applicant or user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful with token pair' })
  async login(@Body() dto: LoginDto, @Req() req: any) {
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip;
    const userAgent = req.headers['user-agent'] || 'Web Browser';
    return this.authService.login(dto, { ip, userAgent, timestamp: new Date() });
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and revoke active session' })
  async logout(@CurrentUser('id') userId: string) {
    return this.authService.logout(userId);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset token' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  // --- OTP Verification Endpoints ---

  @Post('otp/send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send 6-digit OTP to user email for verification' })
  async sendOtp(
    @Body('email') email: string,
    @Body('purpose') purpose?: 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD',
  ) {
    return this.authService.sendOtp(email, purpose || 'LOGIN');
  }

  @Post('otp/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and 6-digit OTP' })
  async verifyOtpLogin(
    @Body('email') email: string,
    @Body('code') code: string,
    @Req() req: any,
  ) {
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip;
    const userAgent = req.headers['user-agent'] || 'Web Browser';
    return this.authService.verifyOtpLogin(email, code, { ip, userAgent, timestamp: new Date() });
  }

  @Post('otp/register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register and verify email with 6-digit OTP' })
  async verifyOtpRegister(
    @Body() dto: {
      email: string;
      code: string;
      password?: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      currentGoal?: any;
    },
  ) {
    return this.authService.verifyOtpRegister(dto);
  }

  @Post('otp/reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using 6-digit OTP' })
  async verifyOtpForgotPassword(
    @Body('email') email: string,
    @Body('code') code: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.authService.verifyOtpForgotPassword(email, code, newPassword);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile and session' })
  async me(@CurrentUser() user: any) {
    return {
      success: true,
      user,
    };
  }
}
