import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, IsOptional, IsNumber, Min, IsUUID } from 'class-validator';
import { KeywordIntent } from '@prisma/client';

export class CreateKeywordDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  term: string;

  @ApiProperty({ enum: KeywordIntent, default: 'INFORMATIONAL' })
  @IsOptional()
  @IsEnum(KeywordIntent)
  intent?: KeywordIntent;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  targetUrl?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  searchVolume?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cpc?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  difficulty?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  groupId?: string;
}

export class CreateKeywordGroupDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;
}
