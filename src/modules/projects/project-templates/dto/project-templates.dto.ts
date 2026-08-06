import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ProjectType } from '@prisma/client';

export class CreateProjectTemplateDto {
  @ApiProperty({ description: 'Name of the template' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Detailed template description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ProjectType, default: ProjectType.FIXED_PRICE })
  @IsNotEmpty()
  @IsEnum(ProjectType)
  type: ProjectType;

  @ApiProperty({ description: 'Estimated hours for this template projects' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  estimatedHours: number;

  @ApiProperty({ description: 'Estimated calendar timeline in days', default: 30 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  estimatedTimelineDays: number;

  @ApiPropertyOptional({ description: 'Milestones, phases, and roles default configuration structure' })
  @IsOptional()
  config?: any;
}

export class UpdateProjectTemplateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ProjectType })
  @IsOptional()
  @IsEnum(ProjectType)
  type?: ProjectType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  estimatedHours?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  estimatedTimelineDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  config?: any;
}
