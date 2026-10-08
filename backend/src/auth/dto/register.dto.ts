import { IsEmail, IsNotEmpty, IsOptional, MinLength, IsEnum, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, GoalType } from '../../common/enums';

export class RegisterDto {
  @ApiProperty({ example: 'applicant@nexora.de' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePassword123!', minLength: 8 })
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'Aarav' })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Sharma' })
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.APPLICANT })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ example: '+91 98765 43210' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ enum: GoalType, default: GoalType.AUSBILDUNG })
  @IsOptional()
  @IsEnum(GoalType)
  currentGoal?: GoalType;
}
