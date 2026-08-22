import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  IsBoolean,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import {
  ProjectType,
  ProjectStatus,
  ProjectPriority,
  ProjectHealth,
} from '@prisma/client';

export class CreateProjectDto {
  @ApiProperty({ description: 'Name of the project' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Detailed project description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ProjectType, default: ProjectType.FIXED_PRICE })
  @IsNotEmpty()
  @IsEnum(ProjectType)
  type: ProjectType;

  @ApiProperty({ enum: ProjectPriority, default: ProjectPriority.MEDIUM })
  @IsNotEmpty()
  @IsEnum(ProjectPriority)
  priority: ProjectPriority;

  @ApiProperty({ enum: ProjectStatus, default: ProjectStatus.PLANNING })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiProperty({ description: 'Estimated budget/cost of the project' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  estimatedCost: number;

  @ApiProperty({ description: 'Estimated revenue of the project' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedRevenue?: number;

  @ApiProperty({ description: 'Estimated efforts in hours' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  estimatedHours: number;

  @ApiProperty({ description: 'Planned start date' })
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Planned end date' })
  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ description: 'Visual color representation' })
  @IsOptional()
  @IsString()
  colorLabel?: string;

  @ApiProperty({ description: 'Associated Project Category ID' })
  @IsNotEmpty()
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({ description: 'Associated Client ID' })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Associated Proposal ID' })
  @IsOptional()
  @IsUUID()
  proposalId?: string;

  @ApiProperty({ description: 'Assigned Project Manager User ID' })
  @IsNotEmpty()
  @IsUUID()
  managerId: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Tags associated with project',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateProjectDto {
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

  @ApiPropertyOptional({ enum: ProjectPriority })
  @IsOptional()
  @IsEnum(ProjectPriority)
  priority?: ProjectPriority;

  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional({ enum: ProjectHealth })
  @IsOptional()
  @IsEnum(ProjectHealth)
  healthStatus?: ProjectHealth;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  estimatedCost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  actualCost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  estimatedRevenue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  estimatedHours?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  actualStartDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  actualEndDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  completionPercentage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  colorLabel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  proposalId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  managerId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class ProjectFilterDto {
  @ApiPropertyOptional({ description: 'Search term for project code/name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional({ enum: ProjectPriority })
  @IsOptional()
  @IsEnum(ProjectPriority)
  priority?: ProjectPriority;

  @ApiPropertyOptional({ enum: ProjectType })
  @IsOptional()
  @IsEnum(ProjectType)
  type?: ProjectType;

  @ApiPropertyOptional({ description: 'Filter by category ID' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Filter by client ID' })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Filter by manager ID' })
  @IsOptional()
  @IsUUID()
  managerId?: string;

  @ApiPropertyOptional({
    description: 'Filter by archived/deleted projects',
    default: 'false',
  })
  @IsOptional()
  @IsString()
  isDeleted?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}

export class CloneProjectDto {
  @ApiProperty({ description: 'New name for the cloned project' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'New start date for cloned project scheduling' })
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ description: 'New project manager user ID' })
  @IsOptional()
  @IsUUID()
  managerId?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  cloneMembers?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  cloneMilestones?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  cloneResources?: boolean;
}
