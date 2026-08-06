import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateClientCategoryDto {
  @ApiProperty({ example: 'Corporate' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'CORPORATE' })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({ example: 'Corporate clients', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateClientCategoryDto {
  @ApiProperty({ example: 'Corporate', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'CORPORATE', required: false })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ example: 'Corporate clients', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
