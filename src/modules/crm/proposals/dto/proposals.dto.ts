import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ProposalStatus, ApprovalStatus } from '@prisma/client';

export class CreateProposalItemDto {
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

  @ApiPropertyOptional({ default: 0.00, description: 'Flat discount value' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  discount?: number;

  @ApiPropertyOptional({ default: 0.00, description: 'Tax percentage (e.g. 18.00)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  tax?: number;
}

export class CreateProposalDto {
  @ApiProperty({ description: 'Opportunity ID reference' })
  @IsUUID()
  opportunityId: string;

  @ApiProperty({ description: 'Title of proposal' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Validity expiry date' })
  @IsDateString()
  validUntil: string;

  @ApiPropertyOptional({ description: 'Proposal template ID reference' })
  @IsUUID()
  @IsOptional()
  templateId?: string;

  @ApiPropertyOptional({ default: 'INR' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ type: [CreateProposalItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProposalItemDto)
  items: CreateProposalItemDto[];
}

export class UpdateProposalDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  validUntil?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  templateId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ enum: ProposalStatus })
  @IsEnum(ProposalStatus)
  @IsOptional()
  status?: ProposalStatus;

  @ApiPropertyOptional({ type: [CreateProposalItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProposalItemDto)
  @IsOptional()
  items?: CreateProposalItemDto[];
}

export class CreateProposalTemplateDto {
  @ApiProperty({ description: 'Template name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Default subject line' })
  @IsString()
  subject: string;

  @ApiProperty({ description: 'HTML template content' })
  @IsString()
  content: string;
}

export class UpdateProposalTemplateDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  content?: string;
}

export class SubmitProposalApprovalDto {
  @ApiProperty({ description: 'Manager User ID to approve' })
  @IsUUID()
  approverId: string;

  @ApiPropertyOptional({ default: 1, description: 'Approval level (1, 2, 3, etc.)' })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  level?: number;
}

export class ReviewProposalApprovalDto {
  @ApiProperty({ enum: ApprovalStatus })
  @IsEnum(ApprovalStatus)
  status: ApprovalStatus;

  @ApiPropertyOptional({ description: 'Review comments' })
  @IsString()
  @IsOptional()
  comments?: string;
}

export class ProposalFilterDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: ProposalStatus })
  @IsEnum(ProposalStatus)
  @IsOptional()
  status?: ProposalStatus;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  opportunityId?: string;

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
