import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
} from 'class-validator';

export class OfferLetterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employeeName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  position: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  joiningDate: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  salaryMonthly: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  department: string;
}

export class AppraisalLetterDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  employeeId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  increasePercentage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  newMonthlySalary?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveDate?: string;
}

export class ExperienceCertificateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  employeeId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  role: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  endDate: string;
}

export class SalaryCertificateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  employeeId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  companyName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  issueDate: string;
}

export class InternshipCertificateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  internName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  collegeName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  position: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  issueDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  hrName: string;
}

export class AppointmentLetterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employeeName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  position: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  joiningDate: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  salaryMonthly: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  department: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  probationPeriod?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  workingHours?: string;
}
