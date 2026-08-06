import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { AlertSeverity } from '@prisma/client';

export class TriggerAlertDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ description: 'FINANCE, CRM, PROJECTS, TASKS, HR, INFRASTRUCTURE, PRODUCTIVITY' })
  @IsNotEmpty()
  @IsString()
  category: string;

  @ApiProperty({ enum: AlertSeverity })
  @IsNotEmpty()
  @IsEnum(AlertSeverity)
  severity: AlertSeverity;
}
