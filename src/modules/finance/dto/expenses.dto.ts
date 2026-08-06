import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, IsNumber, Min, IsDateString, IsEnum } from 'class-validator';
import { ExpenseStatus } from '@prisma/client';

export class CreateExpenseDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  currencyId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  receiptPath?: string;
}

export class UpdateExpenseStatusDto {
  @ApiProperty({ enum: ExpenseStatus })
  @IsNotEmpty()
  @IsEnum(ExpenseStatus)
  status: ExpenseStatus;
}
