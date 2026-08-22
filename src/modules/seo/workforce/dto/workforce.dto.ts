import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsUUID,
  IsDateString,
  IsArray,
  ValidateNested,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSEOActivityTypeDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}

export class UpdateSEOActivityTypeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}

export class CreateSEODailyWorkLogItemDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  activityTypeId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  count?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  targetUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  submissionUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  domainAuthority?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  spamScore?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  timeSpentMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  anchorText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CreateSEODailyWorkLogDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  seoProjectId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  logDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  seoTaskId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDraft?: boolean;

  @ApiProperty({ type: [CreateSEODailyWorkLogItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSEODailyWorkLogItemDto)
  items: CreateSEODailyWorkLogItemDto[];
}

export class UpdateSEODailyWorkLogDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  seoTaskId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDraft?: boolean;

  @ApiPropertyOptional({ type: [CreateSEODailyWorkLogItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSEODailyWorkLogItemDto)
  items?: CreateSEODailyWorkLogItemDto[];
}

export class ReviewSEODailyWorkLogDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(['APPROVED', 'REJECTED', 'REVISION_REQUIRED'])
  status: 'APPROVED' | 'REJECTED' | 'REVISION_REQUIRED';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarksByManager?: string;
}

export class CreateSEOMonthlyTargetDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  executiveId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  seoProjectId?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  month: string; // YYYY-MM

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  activityTypeId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  targetCount: number;
}

export class UpdateSEOMonthlyTargetDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  targetCount: number;
}

export class CreateSEOTaskDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  seoProjectId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  assignedExecutiveId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  priority?: string; // low, medium, high

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  activityTypeId?: string;
}

export class UpdateSEOTaskDto {
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
  @IsString()
  status?: string; // pending, in_progress, ready_for_review, completed, on_hold, overdue

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  activityTypeId?: string;
}

export class ReviewSEOTaskDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(['approved', 'rejected'])
  reviewStatus: 'approved' | 'rejected';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  managerRemarks?: string;
}

export class CreateSEOCredentialDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  seoProjectId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  platform: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  password?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateSEOCredentialDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  platform?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
