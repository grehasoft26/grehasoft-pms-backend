import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePipelineDto {
  @ApiProperty({ description: 'Name of the sales pipeline' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Pipeline description' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdatePipelineDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;
}

export class CreatePipelineStageDto {
  @ApiProperty({ description: 'Pipeline ID reference' })
  @IsUUID()
  pipelineId: string;

  @ApiProperty({ description: 'Stage name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Stage code (unique within pipeline)' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ default: 10, description: 'Winning probability %' })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  probability?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  sortOrder?: number;
}

export class UpdatePipelineStageDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  probability?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  sortOrder?: number;
}
