import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  IsUUID,
} from 'class-validator';
import { ApprovalDecision } from '@prisma/client';

export class CreateWorkflowDefinitionDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateWorkflowStepDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  stepOrder: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  approverRoleId?: string;
}

export class SubmitApprovalDecisionDto {
  @ApiProperty({ enum: ApprovalDecision })
  @IsNotEmpty()
  @IsEnum(ApprovalDecision)
  decision: ApprovalDecision;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comments?: string;
}
