import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Status } from '@prisma/client';

export class CreateDepartmentDto {
  @ApiProperty({ example: 'Engineering' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'ENG' })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsInt()
  displayOrder?: number;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isRoot?: boolean;

  @ApiProperty({ example: 'uuid-parent-department-id', required: false })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiProperty({ example: 'uuid-manager-user-id', required: false })
  @IsOptional()
  @IsUUID()
  managerId?: string;

  @ApiProperty({ example: 'uuid-deputy-manager-user-id', required: false })
  @IsOptional()
  @IsUUID()
  deputyManagerId?: string;

  @ApiProperty({ enum: Status, example: Status.ACTIVE, required: false })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}

export class UpdateDepartmentDto {
  @ApiProperty({ example: 'Software Engineering', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'SWENG', required: false })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ example: 2, required: false })
  @IsOptional()
  @IsInt()
  displayOrder?: number;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isRoot?: boolean;

  @ApiProperty({ example: 'uuid-parent-department-id', required: false })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiProperty({ example: 'uuid-manager-user-id', required: false })
  @IsOptional()
  @IsUUID()
  managerId?: string;

  @ApiProperty({ example: 'uuid-deputy-manager-user-id', required: false })
  @IsOptional()
  @IsUUID()
  deputyManagerId?: string;

  @ApiProperty({ enum: Status, example: Status.ACTIVE, required: false })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}
