import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { Status } from '@prisma/client';

export class CreateTeamDto {
  @ApiProperty({ example: 'PMS Backend Team' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'PMS_BACKEND' })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({ example: 'Core engineering developers for PMS NestJS system', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: Status, example: Status.ACTIVE, required: false })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @ApiProperty({ example: 'uuid-lead-user-id', required: false })
  @IsOptional()
  @IsUUID()
  leadId?: string;
}

export class UpdateTeamDto {
  @ApiProperty({ example: 'Core Platform Engineering', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'CORE_ENG', required: false })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ example: 'Oversees foundational architectural features', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: Status, example: Status.ACTIVE, required: false })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @ApiProperty({ example: 'uuid-lead-user-id', required: false })
  @IsOptional()
  @IsUUID()
  leadId?: string;
}

export class TeamAssignmentDto {
  @ApiProperty({ example: 'uuid-user-id' })
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ApiProperty({ example: 'developer', required: false })
  @IsOptional()
  @IsString()
  roleInTeam?: string;
}

export class TeamAssignmentsDto {
  @ApiProperty({ type: [TeamAssignmentDto] })
  @IsNotEmpty()
  @IsArray()
  members: TeamAssignmentDto[];
}
