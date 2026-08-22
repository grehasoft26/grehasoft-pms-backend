import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import {
  IssueType,
  IssuePriority,
  IssueSeverity,
  IssueStatus,
} from '@prisma/client';

export class CreateProjectIssueDto {
  @ApiProperty({ description: 'Project ID' })
  @IsNotEmpty()
  @IsUUID()
  projectId: string;

  @ApiProperty({ description: 'Issue Title' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Detailed issue description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: IssueType, default: IssueType.BUG })
  @IsNotEmpty()
  @IsEnum(IssueType)
  type: IssueType;

  @ApiProperty({ enum: IssuePriority, default: IssuePriority.MEDIUM })
  @IsNotEmpty()
  @IsEnum(IssuePriority)
  priority: IssuePriority;

  @ApiProperty({ enum: IssueSeverity, default: IssueSeverity.MEDIUM })
  @IsNotEmpty()
  @IsEnum(IssueSeverity)
  severity: IssueSeverity;

  @ApiPropertyOptional({ enum: IssueStatus, default: IssueStatus.OPEN })
  @IsOptional()
  @IsEnum(IssueStatus)
  status?: IssueStatus;

  @ApiPropertyOptional({
    description: 'User ID assigned to resolve this issue',
  })
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @ApiPropertyOptional({ description: 'Steps taken to resolve this issue' })
  @IsOptional()
  @IsString()
  resolution?: string;
}

export class UpdateProjectIssueDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: IssueType })
  @IsOptional()
  @IsEnum(IssueType)
  type?: IssueType;

  @ApiPropertyOptional({ enum: IssuePriority })
  @IsOptional()
  @IsEnum(IssuePriority)
  priority?: IssuePriority;

  @ApiPropertyOptional({ enum: IssueSeverity })
  @IsOptional()
  @IsEnum(IssueSeverity)
  severity?: IssueSeverity;

  @ApiPropertyOptional({ enum: IssueStatus })
  @IsOptional()
  @IsEnum(IssueStatus)
  status?: IssueStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resolution?: string;
}
