import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import {
  User,
  RefreshToken,
  ApplicantProfile,
  Journey,
  JourneyStep,
  AuditLog,
} from '../database/entities';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.AUTH_SECRET || 'nexora_dev_jwt_secret_key_super_secure_2026_x92',
      signOptions: { expiresIn: '2h' },
    }),
    TypeOrmModule.forFeature([
      User,
      RefreshToken,
      ApplicantProfile,
      Journey,
      JourneyStep,
      AuditLog,
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtStrategy, PassportModule, JwtModule],
})
export class AuthModule {}
