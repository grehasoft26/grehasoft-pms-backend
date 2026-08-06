import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsDateString, IsNumber, Min } from 'class-validator';
import { AssetStatus } from '@prisma/client';

export class CreateAssetAssignmentDto {
  @ApiProperty({ description: 'LAPTOP, DESKTOP, MONITOR, MOBILE, SIM, ACCESS_CARD, SOFTWARE_LICENSE' })
  @IsNotEmpty()
  @IsString()
  assetType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  modelName?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  serialNumber: string;

  @ApiPropertyOptional({ default: 12 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  warrantyMonths?: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  purchaseDate: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  vendor: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  assignedDate: string;
}

export class ReturnAssetDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  returnedDate?: string;

  @ApiProperty({ enum: AssetStatus })
  @IsNotEmpty()
  @IsEnum(AssetStatus)
  status: AssetStatus;
}
