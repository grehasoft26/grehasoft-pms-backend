import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateRepositoryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  url: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  owner?: string;

  @ApiPropertyOptional({ default: 'PRIVATE' })
  @IsOptional()
  @IsString()
  visibility?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  primaryLanguage?: string;

  @ApiPropertyOptional({ default: 'main' })
  @IsOptional()
  @IsString()
  defaultBranch?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  webhookEnabled?: boolean;
}

export class CreateRepositoryBranchDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;
}

export class TriggerDeploymentDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  projectId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  serverEnvironmentId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  repositoryBranchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  commitHash?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  rollbackSupport?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  duration?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  buildLogs?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  environmentVariableVersion?: number;
}

export class RollbackDeploymentDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  rollbackReason: string;
}
