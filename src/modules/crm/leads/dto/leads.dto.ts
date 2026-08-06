import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min, IsDateString } from 'class-validator';
import { LeadPriority, LeadTemperature } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateLeadDto {
  @ApiProperty({ description: 'Name of the company/account' })
  @IsString()
  companyName: string;

  @ApiProperty({ description: 'Primary contact person name' })
  @IsString()
  contactName: string;

  @ApiProperty({ description: 'Primary contact email' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'Primary contact phone/mobile' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'Company website URL' })
  @IsString()
  @IsOptional()
  website?: string;

  @ApiPropertyOptional({ description: 'GST Number of the company' })
  @IsString()
  @IsOptional()
  gstNumber?: string;

  @ApiPropertyOptional({ description: 'Expected budget value' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  expectedBudget?: number;

  @ApiPropertyOptional({ description: 'Expected closing date' })
  @IsDateString()
  @IsOptional()
  expectedClosingDate?: string;

  @ApiPropertyOptional({ description: 'Internal remarks or notes' })
  @IsString()
  @IsOptional()
  remarks?: string;

  @ApiPropertyOptional({ enum: LeadPriority, default: LeadPriority.MEDIUM })
  @IsEnum(LeadPriority)
  @IsOptional()
  leadPriority?: LeadPriority;

  @ApiPropertyOptional({ enum: LeadTemperature, default: LeadTemperature.WARM })
  @IsEnum(LeadTemperature)
  @IsOptional()
  leadTemperature?: LeadTemperature;

  @ApiProperty({ description: 'ID of the lead source' })
  @IsUUID()
  sourceId: string;

  @ApiProperty({ description: 'ID of the lead status' })
  @IsUUID()
  statusId: string;

  @ApiProperty({ description: 'Owner User ID' })
  @IsUUID()
  ownerId: string;
}

export class UpdateLeadDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  companyName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  contactName?: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  website?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  gstNumber?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  expectedBudget?: number;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  expectedClosingDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  remarks?: string;

  @ApiPropertyOptional({ enum: LeadPriority })
  @IsEnum(LeadPriority)
  @IsOptional()
  leadPriority?: LeadPriority;

  @ApiPropertyOptional({ enum: LeadTemperature })
  @IsEnum(LeadTemperature)
  @IsOptional()
  leadTemperature?: LeadTemperature;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  sourceId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  statusId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  ownerId?: string;
}

export class LeadFilterDto {
  @ApiPropertyOptional({ description: 'Search term for company, contact name, email, phone, gst' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: LeadPriority })
  @IsEnum(LeadPriority)
  @IsOptional()
  priority?: LeadPriority;

  @ApiPropertyOptional({ enum: LeadTemperature })
  @IsEnum(LeadTemperature)
  @IsOptional()
  temperature?: LeadTemperature;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  statusId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  sourceId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  ownerId?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ description: 'Filter deleted leads' })
  @IsOptional()
  isDeleted?: string;
}

export class AssignLeadDto {
  @ApiProperty({ description: 'ID of user to assign lead to' })
  @IsUUID()
  assigneeId: string;

  @ApiPropertyOptional({ description: 'Optional assignment notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class MergeLeadsDto {
  @ApiProperty({ description: 'ID of the lead that will absorb the secondary lead' })
  @IsUUID()
  primaryLeadId: string;

  @ApiProperty({ description: 'ID of the lead that will be merged and soft-deleted' })
  @IsUUID()
  secondaryLeadId: string;
}
