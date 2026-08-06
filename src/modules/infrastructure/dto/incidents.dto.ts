import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsDateString, IsNumber, Min, IsUUID } from 'class-validator';

export class CreateIncidentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  serverId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  domainId?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiPropertyOptional({ default: 'INVESTIGATING' })
  @IsOptional()
  @IsString()
  status?: string; // OPEN, INVESTIGATING, RESOLVED, POSTMORTEM

  @ApiPropertyOptional({ default: 'MEDIUM' })
  @IsOptional()
  @IsString()
  severity?: string; // LOW, MEDIUM, HIGH, CRITICAL

  @ApiPropertyOptional({ default: 'P3' })
  @IsOptional()
  @IsString()
  priority?: string; // P1, P2, P3, P4

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rootCause?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  resolutionTime?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assignedEngineer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  affectedServices?: string;
}

export class CreateMaintenanceWindowDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  scheduledStart: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  scheduledEnd: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  downtimeExpected?: boolean;

  @ApiPropertyOptional({ default: 'SCHEDULED' })
  @IsOptional()
  @IsString()
  status?: string; // SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
}
