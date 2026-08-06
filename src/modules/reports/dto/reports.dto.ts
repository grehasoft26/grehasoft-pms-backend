import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { FilterScope, DatePreset } from '@prisma/client';

export class CreateReportDefinitionDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  categoryId: string;

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

  @ApiProperty({ description: 'CRM, PROJECTS, FINANCE, HR, INFRASTRUCTURE, PRODUCTIVITY' })
  @IsNotEmpty()
  @IsString()
  module: string;

  @ApiProperty({ description: 'JSON fields list' })
  @IsNotEmpty()
  @IsString()
  fieldsJson: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  filtersJson?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sortJson?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  groupByJson?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  aggregationsJson?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  chartConfigJson?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  exportConfigJson?: string;
}

export class PublishVersionDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  version: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  changeSummary?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  fieldsJson: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  filtersJson?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  chartConfigJson?: string;
}

export class RollbackVersionDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  version: string;
}

export class SaveFilterDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ enum: FilterScope })
  @IsOptional()
  @IsEnum(FilterScope)
  scope?: FilterScope;

  @ApiPropertyOptional({ enum: DatePreset })
  @IsOptional()
  @IsEnum(DatePreset)
  datePreset?: DatePreset;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  filtersJson: string;
}

export class CreateScheduledReportDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY, MANUAL' })
  @IsNotEmpty()
  @IsString()
  frequency: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cronExpression?: string;

  @ApiProperty({ description: 'Comma separated delivery methods e.g. EMAIL,IN_APP' })
  @IsNotEmpty()
  @IsString()
  deliveryMethods: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  recipients?: string;
}
