import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  Min,
} from 'class-validator';
import { TrendDirection } from '@prisma/client';

export class CreateKpiDefinitionDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Mathematical expression for dynamic parsing' })
  @IsNotEmpty()
  @IsString()
  formula: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  targetValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  warningThreshold?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  criticalThreshold?: number;

  @ApiPropertyOptional({ enum: TrendDirection, default: 'HIGHER_IS_BETTER' })
  @IsOptional()
  @IsEnum(TrendDirection)
  trendDirection?: TrendDirection;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  monthlyTarget?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  quarterlyTarget?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  annualTarget?: number;
}

export class RecordSnapshotDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  value: number;
}
