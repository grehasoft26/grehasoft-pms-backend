import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, IsDateString, IsBoolean, IsNumber, Min } from 'class-validator';
import { LeaveStatus, LeaveTypeEnum } from '@prisma/client';

export class CreateLeaveTypeDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ enum: LeaveTypeEnum })
  @IsNotEmpty()
  @IsEnum(LeaveTypeEnum)
  code: LeaveTypeEnum;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  daysAllowed: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  allowHalfDay?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  allowHourly?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  carryForward?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  allowEncashment?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  allowNegative?: boolean;
}

export class CreateLeaveRequestDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  leaveTypeId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isHalfDay?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isHourly?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  hoursRequested?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class CreateLeaveApprovalDto {
  @ApiProperty({ enum: LeaveStatus })
  @IsNotEmpty()
  @IsEnum(LeaveStatus)
  status: LeaveStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comments?: string;
}

export class CreateOvertimeRequestDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  date: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Min(0.5)
  hours: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  reason: string;
}
