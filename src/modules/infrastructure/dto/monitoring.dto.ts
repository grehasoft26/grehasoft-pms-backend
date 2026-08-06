import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsDateString, IsNumber, Min, IsEnum, IsUUID } from 'class-validator';
import { MonitoringStatus } from '@prisma/client';

export class CreateSSLCertificateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  domainId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  subDomainId?: string;

  @ApiProperty({ description: 'LETS_ENCRYPT, CLOUDFLARE, SECTIGO, DIGICERT, CUSTOM' })
  @IsNotEmpty()
  @IsString()
  issuer: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  issuedDate: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  expiryDate: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  wildcard?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  autoRenewal?: boolean;
}

export class UpdateMonitoringCheckDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  value?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  cpuUsage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  ramUsage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  diskUsage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  loadAverage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  networkInKbps?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  networkOutKbps?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  responseTimeMs?: number;

  @ApiProperty({ enum: MonitoringStatus })
  @IsNotEmpty()
  @IsEnum(MonitoringStatus)
  status: MonitoringStatus;
}
