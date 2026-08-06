import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, IsDateString, IsNumber, Min, Max } from 'class-validator';

export class CreateGoalDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  kpi?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  competencies?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  targetDate: string;
}

export class UpdateGoalProgressDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  progress: number;
}

export class CreateReviewCycleDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  endDate: string;
}

export class CreatePerformanceReviewDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  employeeProfileId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  cycleId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  managerId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  selfRating?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  selfFeedback?: string;
}

export class UpdatePerformanceReviewDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  managerRating?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  managerFeedback?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  finalRating?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  finalFeedback?: string;

  @ApiPropertyOptional({ description: 'DRAFT, SUBMITTED, REVIEWED, FINALIZED' })
  @IsOptional()
  @IsString()
  status?: string;
}

export class CreatePipDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  goals: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  endDate: string;
}
