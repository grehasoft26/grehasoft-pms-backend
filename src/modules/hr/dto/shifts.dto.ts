import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  IsNumber,
  Min,
} from 'class-validator';
import { ShiftType } from '@prisma/client';

export class CreateShiftDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ enum: ShiftType })
  @IsNotEmpty()
  @IsEnum(ShiftType)
  type: ShiftType;

  @ApiProperty({ description: 'HH:MM format, e.g. 09:00' })
  @IsNotEmpty()
  @IsString()
  startTime: string;

  @ApiProperty({ description: 'HH:MM format, e.g. 18:00' })
  @IsNotEmpty()
  @IsString()
  endTime: string;

  @ApiPropertyOptional({ default: 15 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  gracePeriod?: number;

  @ApiPropertyOptional({ default: 0.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  nightShiftAllowance?: number;
}

export class AssignShiftDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  shiftId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
