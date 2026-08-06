import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, Min, IsBoolean, IsDateString } from 'class-validator';

export class CreateCourseDto {
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
  @IsNumber()
  @Min(1)
  durationHours: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isExternal?: boolean;
}

export class EnrollEmployeeDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  courseId: string;
}

export class CompleteTrainingDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  completionDate: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  certificateNumber: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  issueDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiryDate?: string;
}
