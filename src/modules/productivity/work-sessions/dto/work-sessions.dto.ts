import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  Min,
  IsIP,
  IsUUID,
} from 'class-validator';
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

export class TrackerHeartbeatDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  appName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currentApp?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  windowTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currentWindow?: string;

  @ApiPropertyOptional({ default: 60 })
  @IsOptional()
  @IsNumber()
  durationSeconds?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isIdle?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  mouseMoves?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  keyPresses?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  clicks?: number;
}

export class TrackerOfflineActivityDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  eventId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  appName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  windowTitle?: string;

  @ApiProperty({ description: 'Duration in seconds' })
  @IsNotEmpty()
  @IsNumber()
  durationSeconds: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  timestamp: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  mouseMoves?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  keyPresses?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  clicks?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isIdle?: boolean;
}

export class TrackerBatchSyncDto {
  @ApiProperty({ type: [TrackerOfflineActivityDto] })
  @IsNotEmpty()
  activities: TrackerOfflineActivityDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  device_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  installation_uuid?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tracker_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  machine_fingerprint?: string;
}
