import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateLeadSourceDto {
  @ApiProperty({ description: 'Name of lead source' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Unique code for lead source' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ description: 'Source description' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateLeadSourceDto {
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
