import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, IsNumber, Min, IsDateString, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { InvoiceItemType, InvoiceStatus } from '@prisma/client';

export class CreateInvoiceItemDto {
  @ApiProperty({ enum: InvoiceItemType })
  @IsNotEmpty()
  @IsEnum(InvoiceItemType)
  type: InvoiceItemType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  timeEntryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  taskId?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ default: 1 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  rate: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tax?: number;
}

export class CreateInvoiceDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  clientId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  issueDate: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tax?: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  currencyId: string;

  @ApiProperty({ type: [CreateInvoiceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];
}

export class GenerateTimeEntryInvoiceDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  clientId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID(undefined, { each: true })
  timeEntryIds: string[];

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  currencyId: string;
}

export class PaymentAllocationDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  invoiceId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  amountAllocated: number;
}

export class AddPaymentDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  paymentMethodId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiProperty({ type: [PaymentAllocationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentAllocationDto)
  allocations: PaymentAllocationDto[];
}
