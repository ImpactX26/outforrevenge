import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
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

  private async generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '2h',
      secret: process.env.AUTH_SECRET || 'nexora_dev_jwt_secret_key_super_secure_2026_x92',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
      secret: process.env.AUTH_REFRESH_SECRET || 'nexora_dev_refresh_jwt_secret_key_super_secure_2026_y83',
    });

    const tokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

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
      expiresIn: 7200,
    };
  }
}
