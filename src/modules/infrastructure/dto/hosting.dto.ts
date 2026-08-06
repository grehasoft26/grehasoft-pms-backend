import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsNumber, Min, IsUUID } from 'class-validator';

export class CreateHostingPlanDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  providerId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  diskGb: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Min(0.5)
  ramGb: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  cpuCores: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  bandwidthGb: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceMonthly?: number;
}

export class CreateHostingAccountDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  providerId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  accountUsername: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  controlPanelUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  hostingPlanId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  diskLimitGb?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  bandwidthLimitGb?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
