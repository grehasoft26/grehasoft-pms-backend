import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
  IsDateString,
  Min,
  Max,
} from 'class-validator';

export class CreateProjectResourceDto {
  @ApiProperty({ description: 'Project ID' })
  @IsNotEmpty()
  @IsUUID()
  projectId: string;

  @ApiProperty({ description: 'Employee User ID' })
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'Allocation percentage (e.g. 50 = half time)',
    default: 100,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(100)
  allocationPercentage: number;

  @ApiProperty({ description: 'Allocation start date' })
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Allocation end date' })
  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @ApiProperty({
    description: 'Assigned role for allocation',
    default: 'Developer',
  })
  @IsNotEmpty()
  @IsString()
  role: string;
}

export class UpdateProjectResourceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  allocationPercentage?: number;

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
  @IsString()
  role?: string;
}
