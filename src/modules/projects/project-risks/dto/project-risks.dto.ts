import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { RiskStatus } from '@prisma/client';

export class CreateProjectRiskDto {
  @ApiProperty({ description: 'Project ID' })
  @IsNotEmpty()
  @IsUUID()
  projectId: string;

  @ApiProperty({ description: 'Risk Title' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Description of risk' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Probability score (1-5)', default: 1 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(5)
  probability: number;

  @ApiProperty({ description: 'Impact score (1-5)', default: 1 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(5)
  impact: number;

  @ApiPropertyOptional({ description: 'Mitigation plan' })
  @IsOptional()
  @IsString()
  mitigationPlan?: string;

  @ApiPropertyOptional({ description: 'Risk Owner User ID' })
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional({ enum: RiskStatus, default: RiskStatus.IDENTIFIED })
  @IsOptional()
  @IsEnum(RiskStatus)
  status?: RiskStatus;
}

export class UpdateProjectRiskDto {
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
  @IsNumber()
  @Min(1)
  @Max(5)
  probability?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  impact?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mitigationPlan?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional({ enum: RiskStatus })
  @IsOptional()
  @IsEnum(RiskStatus)
  status?: RiskStatus;
}
