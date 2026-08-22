import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
  IsDateString,
  Min,
  Max,
  IsArray,
} from 'class-validator';
import { MilestoneStatus } from '@prisma/client';

export class CreateProjectMilestoneDto {
  @ApiProperty({ description: 'Associated Project ID' })
  @IsNotEmpty()
  @IsUUID()
  projectId: string;

  @ApiPropertyOptional({ description: 'Associated Phase ID' })
  @IsOptional()
  @IsUUID()
  phaseId?: string;

  @ApiProperty({ description: 'Milestone Title' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Milestone Details/Description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Planned due date' })
  @IsNotEmpty()
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional({
    enum: MilestoneStatus,
    default: MilestoneStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(MilestoneStatus)
  status?: MilestoneStatus;

  @ApiPropertyOptional({ description: 'Completion percentage', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  completionPercentage?: number;

  @ApiProperty({ description: 'Owner User ID' })
  @IsNotEmpty()
  @IsUUID()
  ownerId: string;

  @ApiProperty({ description: 'Estimated hours' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  estimatedHours: number;

  @ApiPropertyOptional({ description: 'Actual hours logged' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  actualHours?: number;

  @ApiPropertyOptional({
    type: [String],
    description: 'List of Milestone IDs this milestone depends on',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  dependsOnMilestones?: string[];
}

export class UpdateProjectMilestoneDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  phaseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ enum: MilestoneStatus })
  @IsOptional()
  @IsEnum(MilestoneStatus)
  status?: MilestoneStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  completionPercentage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedHours?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  actualHours?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  dependsOnMilestones?: string[];
}
