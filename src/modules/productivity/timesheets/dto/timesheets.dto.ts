import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';
import { TimesheetStatus } from '@prisma/client';

export class SubmitTimesheetDto {
  @ApiProperty({ description: 'Start date of the week (Monday)' })
  @IsNotEmpty()
  @IsDateString()
  startDate: string;
}

export class ApproveTimesheetDto {
  @ApiProperty({
    enum: TimesheetStatus,
    description: 'MANAGER_APPROVED, FINANCE_APPROVED, REJECTED',
  })
  @IsNotEmpty()
  @IsEnum(TimesheetStatus)
  status: TimesheetStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comments?: string;
}
