import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum, IsBoolean, IsOptional, IsString } from 'class-validator';
import { NotificationChannel, DigestFrequency } from '@prisma/client';

export class UpdatePreferenceDto {
  @ApiProperty({ enum: NotificationChannel })
  @IsNotEmpty()
  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ enum: DigestFrequency, default: 'IMMEDIATE' })
  @IsNotEmpty()
  @IsEnum(DigestFrequency)
  digestFrequency: DigestFrequency;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  quietHoursStart?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  quietHoursEnd?: string;

  @ApiPropertyOptional({ default: 'UTC' })
  @IsOptional()
  @IsString()
  timezone?: string;
}
