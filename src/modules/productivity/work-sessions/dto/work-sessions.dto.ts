import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, Min, IsIP } from 'class-validator';
import { BreakType, IdleType } from '@prisma/client';

export class StartWorkSessionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userAgent?: string;
}

export class LogBreakDto {
  @ApiProperty({ enum: BreakType })
  @IsNotEmpty()
  @IsEnum(BreakType)
  type: BreakType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class LogIdleDto {
  @ApiProperty({ enum: IdleType })
  @IsNotEmpty()
  @IsEnum(IdleType)
  type: IdleType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class LogActivityDto {
  @ApiProperty({ default: 0 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  keyboardCount: number;

  @ApiProperty({ default: 0 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  mouseCount: number;

  @ApiProperty({ default: 0 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  clicksCount: number;

  @ApiProperty({ default: 0 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  scrollsCount: number;
}

export class LogAppUsageDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  appName: string;

  @ApiProperty({ description: 'Duration in seconds' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  duration: number;

  @ApiPropertyOptional({ description: 'PRODUCTIVE, UNPRODUCTIVE, NEUTRAL' })
  @IsOptional()
  @IsString()
  category?: string;
}

export class LogWebUsageDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  domain: string;

  @ApiProperty({ description: 'Duration in seconds' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  duration: number;

  @ApiPropertyOptional({ description: 'PRODUCTIVE, UNPRODUCTIVE, NEUTRAL' })
  @IsOptional()
  @IsString()
  category?: string;
}

export class LogScreenshotDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  filePath: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resolution?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  monitor?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isBlurred?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isCompressed?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  checksum?: string;
}
