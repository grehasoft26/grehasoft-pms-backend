import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOpportunityItemDto {
  @ApiProperty({ description: 'Product or service name' })
  @IsString()
  productName: string;

  @ApiPropertyOptional({ default: 1 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  quantity?: number;

  @ApiProperty({ description: 'Price per unit' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @ApiPropertyOptional({ default: 0.0, description: 'Flat discount value' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  discount?: number;

  @ApiPropertyOptional({
    default: 0.0,
    description: 'Tax percentage (e.g. 18.00)',
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  tax?: number;
}

export class CreateOpportunityDto {
  @ApiPropertyOptional({ description: 'Reference to Lead ID if converted' })
  @IsUUID()
  @IsOptional()
  leadId?: string;

  @ApiProperty({ description: 'Name of the opportunity' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Opportunity value (sum of line items or manually estimated)',
  })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  value: number;

  @ApiPropertyOptional({ default: 10, description: 'Probability %' })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  probability?: number;

  @ApiProperty({ description: 'Expected close date' })
  @IsDateString()
  expectedCloseDate: string;

  @ApiProperty({ description: 'Pipeline stage ID' })
  @IsUUID()
  stageId: string;

  @ApiProperty({ description: 'Owner User ID' })
  @IsUUID()
  ownerId: string;

  @ApiPropertyOptional({ description: 'Competitors list/names' })
  @IsString()
  @IsOptional()
  competitors?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  winReason?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  lossReason?: string;

  @ApiPropertyOptional({ type: [CreateOpportunityItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOpportunityItemDto)
  @IsOptional()
  items?: CreateOpportunityItemDto[];
}

export class UpdateOpportunityDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  leadId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  value?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  probability?: number;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  expectedCloseDate?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  stageId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  ownerId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  competitors?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  winReason?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  lossReason?: string;

  @ApiPropertyOptional({ type: [CreateOpportunityItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOpportunityItemDto)
  @IsOptional()
  items?: CreateOpportunityItemDto[];
}

export class ConvertLeadDto {
  @ApiProperty({ description: 'ID of qualified Lead to convert' })
  @IsUUID()
  leadId: string;

  @ApiPropertyOptional({ description: 'Pipeline ID to associate with the Opportunity' })
  @IsUUID()
  @IsOptional()
  pipelineId?: string;

  @ApiPropertyOptional({ description: 'Starting Pipeline Stage ID' })
  @IsUUID()
  @IsOptional()
  stageId?: string;

  @ApiPropertyOptional({ description: 'Expected close date' })
  @IsDateString()
  @IsOptional()
  expectedCloseDate?: string;

  @ApiPropertyOptional({ description: 'Owner User ID' })
  @IsUUID()
  @IsOptional()
  ownerId?: string;

  @ApiPropertyOptional({ type: [CreateOpportunityItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOpportunityItemDto)
  @IsOptional()
  items?: CreateOpportunityItemDto[];
}

export class OpportunityFilterDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  stageId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  ownerId?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  isDeleted?: string;
}
