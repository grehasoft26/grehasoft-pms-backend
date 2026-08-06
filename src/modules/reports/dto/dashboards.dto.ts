import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsEnum, IsBoolean, IsNumber, Min, IsUUID } from 'class-validator';
import { DashboardType, SharePermission } from '@prisma/client';

export class CreateDashboardDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: DashboardType })
  @IsOptional()
  @IsEnum(DashboardType)
  type?: DashboardType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiPropertyOptional({ default: 'MANUAL' })
  @IsOptional()
  @IsString()
  refreshInterval?: string; // MANUAL, 30S, 1M, 5M, 15M, 1H
}

export class ShareDashboardDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  roleId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiProperty({ enum: SharePermission })
  @IsNotEmpty()
  @IsEnum(SharePermission)
  permission: SharePermission;
}

export class AddWidgetDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  widgetId?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  xPos?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  yPos?: number;

  @ApiPropertyOptional({ default: 4 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  width?: number;

  @ApiPropertyOptional({ default: 3 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  height?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  overrideConfigJson?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  drillDownMetadata?: string; // Drill-down pathways
}

export class PinDashboardDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  isPinned: boolean;
}
