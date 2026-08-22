import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ContractStatus } from '@prisma/client';

export class CreateClientContractDto {
  @ApiProperty({ example: 'uuid-client-id' })
  @IsNotEmpty()
  @IsUUID()
  clientId: string;

  @ApiProperty({ example: 'CON-2026-0001' })
  @IsNotEmpty()
  @IsString()
  contractNumber: string;

  @ApiProperty({ example: '2026-08-01' })
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2027-07-31' })
  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @ApiProperty({ example: '2027-07-01', required: false })
  @IsOptional()
  @IsDateString()
  renewalDate?: string;

  @ApiProperty({
    enum: ContractStatus,
    example: ContractStatus.DRAFT,
    required: false,
  })
  @IsOptional()
  @IsEnum(ContractStatus)
  status?: ContractStatus;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  renewalReminder?: boolean;

  @ApiProperty({ example: 'general/document-1234.pdf', required: false })
  @IsOptional()
  @IsString()
  documentReference?: string;

  @ApiProperty({ example: 150000.0, required: false })
  @IsOptional()
  @IsNumber()
  contractValue?: number;

  @ApiProperty({ example: 'INR', default: 'INR', required: false })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  autoRenewal?: boolean;

  @ApiProperty({
    example: 30,
    description: 'Notice period in days',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  noticePeriod?: number;

  @ApiProperty({ example: 'uuid-user-id', required: false })
  @IsOptional()
  @IsUUID()
  renewalOwnerId?: string;
}

export class UpdateClientContractDto {
  @ApiProperty({ example: 'CON-2026-0001', required: false })
  @IsOptional()
  @IsString()
  contractNumber?: string;

  @ApiProperty({ example: '2026-08-01', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ example: '2027-07-31', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ example: '2027-07-01', required: false })
  @IsOptional()
  @IsDateString()
  renewalDate?: string;

  @ApiProperty({
    enum: ContractStatus,
    example: ContractStatus.ACTIVE,
    required: false,
  })
  @IsOptional()
  @IsEnum(ContractStatus)
  status?: ContractStatus;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  renewalReminder?: boolean;

  @ApiProperty({ example: 'general/document-1234.pdf', required: false })
  @IsOptional()
  @IsString()
  documentReference?: string;

  @ApiProperty({ example: 150000.0, required: false })
  @IsOptional()
  @IsNumber()
  contractValue?: number;

  @ApiProperty({ example: 'INR', required: false })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  autoRenewal?: boolean;

  @ApiProperty({
    example: 30,
    description: 'Notice period in days',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  noticePeriod?: number;

  @ApiProperty({ example: 'uuid-user-id', required: false })
  @IsOptional()
  @IsUUID()
  renewalOwnerId?: string;
}
