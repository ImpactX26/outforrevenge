import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '../database/entities/user.entity';
import { RefreshToken } from '../database/entities/refresh-token.entity';
import { ApplicantProfile } from '../database/entities/applicant-profile.entity';
import { Journey } from '../database/entities/journey.entity';
import { JourneyStep } from '../database/entities/journey-step.entity';
import { AuditLog } from '../database/entities/audit-log.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole, GoalType, JourneyStepStatus } from '../common/enums';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(ApplicantProfile)
    private readonly profileRepository: Repository<ApplicantProfile>,
    @InjectRepository(Journey)
    private readonly journeyRepository: Repository<Journey>,
    @InjectRepository(JourneyStep)
    private readonly journeyStepRepository: Repository<JourneyStep>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('An account with this email address already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const role = dto.role || UserRole.APPLICANT;

    const user = this.userRepository.create({
      email: dto.email.toLowerCase(),
      passwordHash: hashedPassword,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role,
      phone: dto.phone,
      isActive: true,
    });

    const savedUser = await this.userRepository.save(user);

    // If applicant, initialize profile and journey
    if (role === UserRole.APPLICANT) {
      const profile = this.profileRepository.create({
        userId: savedUser.id,
        currentGoal: dto.currentGoal || GoalType.AUSBILDUNG,
        phone: dto.phone,
        profileCompleteness: 20,
        readinessScore: 15,
        preferredPathways: dto.currentGoal ? [dto.currentGoal] : [GoalType.AUSBILDUNG],
      });
      await this.profileRepository.save(profile);

      const journey = this.journeyRepository.create({
        applicantId: savedUser.id,
        currentState: 'ONBOARDING',
        progressPercentage: 10,
      });
      const savedJourney = await this.journeyRepository.save(journey);

      const defaultSteps = [
        { order: 1, code: 'PROFILE_SETUP', title: 'Complete Profile & Goal', description: 'Personal details and selected Germany pathway.', status: JourneyStepStatus.IN_PROGRESS },
        { order: 2, code: 'DOCUMENT_UPLOAD', title: 'Upload Academic Documents', description: 'Degrees, transcripts, and credentials.', status: JourneyStepStatus.PENDING },
        { order: 3, code: 'VIDEO_INTRO', title: 'Record Video Introduction', description: '60-second video overview.', status: JourneyStepStatus.PENDING },
        { order: 4, code: 'QUALIFICATION_CHECK', title: 'Qualification Assessment', description: 'Systematic requirement verification.', status: JourneyStepStatus.PENDING },
        { order: 5, code: 'OPPORTUNITY_MATCHING', title: 'Explore Opportunities', description: 'Target Study, Ausbildung or Job positions.', status: JourneyStepStatus.LOCKED },
        { order: 6, code: 'EDUCARO_NEXT_STEP', title: 'Educaro Next Step', description: 'Recommended services and application guidance.', status: JourneyStepStatus.LOCKED },
        { order: 7, code: 'CV_GENERATION', title: 'Generate German Format CV', description: 'Professional German standard CV builder.', status: JourneyStepStatus.LOCKED },
      ];

      for (const step of defaultSteps) {
        await this.journeyStepRepository.save(
          this.journeyStepRepository.create({
            journeyId: savedJourney.id,
            stepOrder: step.order,
            code: step.code,
            title: step.title,
            description: step.description,
            status: step.status,
          }),
        );
      }
    }

    const tokens = await this.generateTokens(savedUser);

    await this.auditLogRepository.save(
      this.auditLogRepository.create({
        userId: savedUser.id,
        action: 'REGISTER',
        entityType: 'USER',
        entityId: savedUser.id,
        details: { role: savedUser.role },
      }),
    );

    return {
      success: true,
      user: {
        id: savedUser.id,
        email: savedUser.email,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        role: savedUser.role,
      },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email: dto.email.toLowerCase() })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account has been deactivated');
    }

    const tokens = await this.generateTokens(user);

    await this.auditLogRepository.save(
      this.auditLogRepository.create({
        userId: user.id,
        action: 'LOGIN',
        entityType: 'USER',
        entityId: user.id,
      }),
    );

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      ...tokens,
    };
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.AUTH_REFRESH_SECRET || 'nexora_dev_refresh_jwt_secret_key_super_secure_2026_y83',
      });

      const user = await this.userRepository.findOne({ where: { id: payload.sub } });
      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid session');
      }

      // Check if token exists and is not revoked
      const tokens = await this.refreshTokenRepository.find({
        where: { userId: user.id, isRevoked: false },
      });

      let found = false;
      for (const t of tokens) {
        if (await bcrypt.compare(token, t.tokenHash)) {
          found = true;
          // Revoke old token for rotation
          t.isRevoked = true;
          await this.refreshTokenRepository.save(t);
          break;
        }
      }

      if (!found) {
        throw new UnauthorizedException('Refresh token is invalid or has expired');
      }

      const newTokens = await this.generateTokens(user);
      return {
        success: true,
        ...newTokens,
      };
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string) {
    await this.refreshTokenRepository.update({ userId }, { isRevoked: true });
    return { success: true, message: 'Logged out successfully' };
  }

  async forgotPassword(email: string) {
    const user = await this.userRepository.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      // Return success to avoid email enumeration
      return { success: true, message: 'If an account exists with this email, password reset instructions have been generated.' };
    }

    // In production, an email would be sent. For demo, we issue a reset token in audit logs.
    const resetToken = this.jwtService.sign(
      { sub: user.id, purpose: 'RESET_PASSWORD' },
      { expiresIn: '1h', secret: process.env.AUTH_SECRET || 'nexora_dev_jwt_secret_key_super_secure_2026_x92' },
    );

    await this.auditLogRepository.save(
      this.auditLogRepository.create({
        userId: user.id,
        action: 'FORGOT_PASSWORD_REQUEST',
        details: { resetTokenCreated: true },
      }),
    );

    return {
      success: true,
      message: 'Password reset link generated.',
      demoResetToken: resetToken,
    };
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.AUTH_SECRET || 'nexora_dev_jwt_secret_key_super_secure_2026_x92',
      });

      if (payload.purpose !== 'RESET_PASSWORD') {
        throw new BadRequestException('Invalid token purpose');
      }

      const user = await this.userRepository.findOne({ where: { id: payload.sub } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      user.passwordHash = await bcrypt.hash(newPassword, 10);
      await this.userRepository.save(user);

      // Revoke all existing sessions
      await this.refreshTokenRepository.update({ userId: user.id }, { isRevoked: true });

      return { success: true, message: 'Password has been reset successfully. Please log in with your new password.' };
    } catch (e) {
      throw new BadRequestException('Invalid or expired password reset token');
    }
  }

  // --- OTP Verification Flows ---

  private readonly otpStore = new Map<string, { code: string; expiresAt: Date; purpose: string }>();

  async sendOtp(email: string, purpose = 'LOGIN') {
    const cleanEmail = email.toLowerCase().trim();
    // Generate secure 6-digit OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    this.otpStore.set(`${cleanEmail}_${purpose}`, { code, expiresAt, purpose });
    this.logger.log(`[Nexora Auth] Generated ${purpose} OTP for ${cleanEmail}: ${code}`);

    return {
      success: true,
      message: `Verification code sent to ${cleanEmail}`,
      email: cleanEmail,
      // Provide OTP in dev for frictionless testing
      code: process.env.NODE_ENV !== 'production' ? code : undefined,
    };
  }

  async verifyOtpLogin(email: string, code: string) {
    const cleanEmail = email.toLowerCase().trim();
    const stored = this.otpStore.get(`${cleanEmail}_LOGIN`);

    if (!stored || stored.code !== code.trim() || new Date() > stored.expiresAt) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    this.otpStore.delete(`${cleanEmail}_LOGIN`);

    let user = await this.userRepository.findOne({ where: { email: cleanEmail } });
    if (!user) {
      // Auto-register verified email as APPLICANT
      const randomPassword = await bcrypt.hash(Math.random().toString(36), 10);
      user = this.userRepository.create({
        email: cleanEmail,
        firstName: cleanEmail.split('@')[0],
        lastName: 'User',
        passwordHash: randomPassword,
        role: UserRole.APPLICANT,
        isActive: true,
      });
      user = await this.userRepository.save(user);

      // Create applicant profile
      const profile = this.profileRepository.create({
        userId: user.id,
        currentGoal: GoalType.AUSBILDUNG,
        profileCompleteness: 20,
        readinessScore: 15,
      });
      await this.profileRepository.save(profile);
    }

    const tokens = await this.generateTokens(user);

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      ...tokens,
    };
  }

  async verifyOtpRegister(dto: {
    email: string;
    code: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    role?: UserRole;
    phone?: string;
  }) {
    const cleanEmail = dto.email.toLowerCase().trim();
    const stored = this.otpStore.get(`${cleanEmail}_REGISTER`);

    if (!stored || stored.code !== dto.code.trim() || new Date() > stored.expiresAt) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    this.otpStore.delete(`${cleanEmail}_REGISTER`);

    const existing = await this.userRepository.findOne({ where: { email: cleanEmail } });
    if (existing) {
      throw new ConflictException('An account with this email address already exists');
    }

    const passwordToHash = dto.password || 'NexoraPass2026!';
    const hashedPassword = await bcrypt.hash(passwordToHash, 10);
    const role = dto.role || UserRole.APPLICANT;

    const user = this.userRepository.create({
      email: cleanEmail,
      passwordHash: hashedPassword,
      firstName: dto.firstName || cleanEmail.split('@')[0],
      lastName: dto.lastName || '',
      role,
      phone: dto.phone,
      isActive: true,
    });
    const savedUser = await this.userRepository.save(user);

    if (role === UserRole.APPLICANT) {
      const profile = this.profileRepository.create({
        userId: savedUser.id,
        currentGoal: GoalType.AUSBILDUNG,
        phone: dto.phone,
        profileCompleteness: 20,
        readinessScore: 15,
      });
      await this.profileRepository.save(profile);
    }

    const tokens = await this.generateTokens(savedUser);

    return {
      success: true,
      user: {
        id: savedUser.id,
        email: savedUser.email,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        role: savedUser.role,
      },
      ...tokens,
    };
  }

  async verifyOtpForgotPassword(email: string, code: string, newPassword: string) {
    const cleanEmail = email.toLowerCase().trim();
    const stored = this.otpStore.get(`${cleanEmail}_FORGOT_PASSWORD`);

    if (!stored || stored.code !== code.trim() || new Date() > stored.expiresAt) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    this.otpStore.delete(`${cleanEmail}_FORGOT_PASSWORD`);

    const user = await this.userRepository.findOne({ where: { email: cleanEmail } });
    if (!user) {
      throw new NotFoundException('No account found with this email address');
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);

    // Revoke all existing sessions
    await this.refreshTokenRepository.update({ userId: user.id }, { isRevoked: true });

    return {
      success: true,
      message: 'Password reset successful. Please sign in with your new password.',
    };
  }

  private async generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    // 30 days session for seamless persistent login
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '30d',
      secret: process.env.AUTH_SECRET || 'nexora_dev_jwt_secret_key_super_secure_2026_x92',
    });

    // 90 days refresh token
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '90d',
      secret: process.env.AUTH_REFRESH_SECRET || 'nexora_dev_refresh_jwt_secret_key_super_secure_2026_y83',
    });

    const tokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

    await this.refreshTokenRepository.save(
      this.refreshTokenRepository.create({
        userId: user.id,
        tokenHash,
        expiresAt,
      }),
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 30 * 24 * 3600, // 30 days in seconds
    };
  }
}
