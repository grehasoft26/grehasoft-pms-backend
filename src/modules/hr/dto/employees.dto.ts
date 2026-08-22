import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EmploymentStatus, EmployeeDocumentCategory } from '@prisma/client';

export class AddEmergencyContactDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  relationship: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;
}

export class AddSkillDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'BEGINNER, INTERMEDIATE, EXPERT' })
  @IsNotEmpty()
  @IsString()
  proficiency: string;
}

export class AddDocumentDto {
  @ApiProperty({ enum: EmployeeDocumentCategory })
  @IsNotEmpty()
  @IsEnum(EmployeeDocumentCategory)
  category: EmployeeDocumentCategory;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  documentPath: string;
}

export class CreateEmployeeProfileDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  dateOfJoining: string;

  @ApiPropertyOptional({ enum: EmploymentStatus })
  @IsOptional()
  @IsEnum(EmploymentStatus)
  employmentStatus?: EmploymentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bloodGroup?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nationality?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  maritalStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  passport?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  drivingLicense?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  aadhaar?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pan?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankDetails?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  businessUnitId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  divisionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  reportingManagerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  skipLevelManagerId?: string;

  // Payroll Placeholders
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  payrollGroup?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  salaryGrade?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  costCenter?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employmentCategory?: string;
}
