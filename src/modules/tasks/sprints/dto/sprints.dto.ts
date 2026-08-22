import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsArray,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { SprintStatus } from '@prisma/client';

export class CreateSprintDto {
  @ApiProperty({ description: 'Associated Project ID' })
  @IsNotEmpty()
  @IsUUID()
  projectId: string;

  @ApiProperty({ description: 'Sprint Name' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Sprint Start Date' })
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Sprint End Date' })
  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ enum: SprintStatus, default: SprintStatus.PLANNING })
  @IsOptional()
  @IsEnum(SprintStatus)
  status?: SprintStatus;

  @ApiPropertyOptional({
    type: [String],
    description: 'Optional Sprint goals list',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  goals?: string[];
}

export class UpdateSprintDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: SprintStatus })
  @IsOptional()
  @IsEnum(SprintStatus)
  status?: SprintStatus;
}

export class CreateSprintGoalDto {
  @ApiProperty({ description: 'Associated Sprint ID' })
  @IsNotEmpty()
  @IsUUID()
  sprintId: string;

  @ApiProperty({ description: 'Goal text' })
  @IsNotEmpty()
  @IsString()
  goal: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isAchieved?: boolean;
}
