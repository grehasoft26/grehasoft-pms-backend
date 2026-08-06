import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateLeadStatusDto {
  @ApiProperty({ description: 'Name of lead status' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Unique code for lead status' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ description: 'Status description' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateLeadStatusDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;
}
