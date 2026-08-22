import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  Min,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { ServerType, Environment, InfrastructureStatus } from '@prisma/client';

export class CreateServerDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  ipAddress: string;

  @ApiPropertyOptional({ default: 22 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  sshPort?: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  os: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  providerId?: string;

  @ApiPropertyOptional({ enum: ServerType })
  @IsOptional()
  @IsEnum(ServerType)
  type?: ServerType;

  @ApiPropertyOptional({ enum: InfrastructureStatus })
  @IsOptional()
  @IsEnum(InfrastructureStatus)
  status?: InfrastructureStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  diskGb?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  ramGb?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  cpuCores?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  owner?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  serverIp?: string;
}

export class CreateServerEnvironmentDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  serverId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiProperty({ enum: Environment })
  @IsNotEmpty()
  @IsEnum(Environment)
  environment: Environment;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  domainName?: string;
}
