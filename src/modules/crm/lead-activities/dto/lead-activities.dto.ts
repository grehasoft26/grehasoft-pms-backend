import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { LeadActivityType } from '@prisma/client';

export class CreateLeadActivityDto {
  @ApiProperty({ description: 'Lead ID' })
  @IsUUID()
  leadId: string;

  @ApiProperty({ enum: LeadActivityType, default: LeadActivityType.NOTE })
  @IsEnum(LeadActivityType)
  type: LeadActivityType;

  @ApiProperty({ description: 'Short summary or title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Detailed activity description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Date activity occurred' })
  @IsDateString()
  @IsOptional()
  activityDate?: string;
}

export class UpdateLeadActivityDto {
  @ApiPropertyOptional({ enum: LeadActivityType })
  @IsEnum(LeadActivityType)
  @IsOptional()
  type?: LeadActivityType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  activityDate?: string;
}
