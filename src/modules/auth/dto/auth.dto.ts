import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'superadmin@grehasoft.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SuperAdminPassword123' })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'My Laptop', required: false })
  @IsOptional()
  @IsString()
  deviceName?: string;

  @ApiProperty({ example: 'desktop', required: false })
  @IsOptional()
  @IsString()
  deviceType?: string;

  @ApiProperty({ example: 'Chrome', required: false })
  @IsOptional()
  @IsString()
  browser?: string;

  @ApiProperty({ example: 'Windows 11', required: false })
  @IsOptional()
  @IsString()
  operatingSystem?: string;

  @ApiProperty({ example: '123456', required: false })
  @IsOptional()
  @IsString()
  mfaCode?: string;
}

export class TokenRefreshDto {
  @ApiProperty({ example: 'jwt-refresh-token-string' })
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'superadmin@grehasoft.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'secure-reset-token-value' })
  @IsNotEmpty()
  @IsString()
  token: string;

  @ApiProperty({ example: 'NewSecurePass@123' })
  @IsNotEmpty()
  @IsString()
  newPassword: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'SuperAdminPassword123' })
  @IsNotEmpty()
  @IsString()
  oldPassword: string;

  @ApiProperty({ example: 'NewSecurePass@123' })
  @IsNotEmpty()
  @IsString()
  newPassword: string;
}
