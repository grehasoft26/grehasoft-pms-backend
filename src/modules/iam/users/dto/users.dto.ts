import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { UserStatus } from '@prisma/client';

export class UserPreferenceDto {
  @ApiProperty({ example: 'dark', required: false })
  @IsOptional()
  @IsString()
  theme?: string;

  @ApiProperty({ example: 'en', required: false })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiProperty({ example: 'Asia/Kolkata', required: false })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  notificationsEnabled?: boolean;
}

export class CreateUserDto {
  @ApiProperty({ example: 'jisha.charly@gmail.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Jisha' })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Charly' })
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'Password123' })
  @IsNotEmpty()
  @IsString()
  password?: string;

  @ApiProperty({ enum: UserStatus, example: UserStatus.PENDING, required: false })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiProperty({ example: 'uuid-role-id', required: false })
  @IsOptional()
  @IsUUID()
  roleId?: string;

  @ApiProperty({ example: 'uuid-department-id', required: false })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiProperty({ example: 'uuid-designation-id', required: false })
  @IsOptional()
  @IsUUID()
  designationId?: string;

  @ApiProperty({ type: UserPreferenceDto, required: false })
  @IsOptional()
  preferences?: UserPreferenceDto;
}

export class UpdateUserDto {
  @ApiProperty({ example: 'Jisha', required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ example: 'Charly', required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE, required: false })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiProperty({ example: 'uuid-role-id', required: false })
  @IsOptional()
  @IsUUID()
  roleId?: string;

  @ApiProperty({ example: 'uuid-department-id', required: false })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiProperty({ example: 'uuid-designation-id', required: false })
  @IsOptional()
  @IsUUID()
  designationId?: string;

  @ApiProperty({ type: UserPreferenceDto, required: false })
  @IsOptional()
  preferences?: UserPreferenceDto;
}
