import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
  IsDateString,
  Min,
} from 'class-validator';

export class CreateProjectPhaseDto {
  @ApiProperty({ description: 'Associated Project ID' })
  @IsNotEmpty()
  @IsUUID()
  projectId: string;

  @ApiProperty({ description: 'Name of the phase' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Phase code, unique within a project' })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({ description: 'Sorting order', default: 0 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  sortOrder: number;

  @ApiPropertyOptional({ description: 'Planned start date for the phase' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Planned end date for the phase' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class UpdateProjectPhaseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
