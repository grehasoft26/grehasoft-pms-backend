import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Status } from '@prisma/client';

export class CreateDesignationDto {
  @ApiProperty({ example: 'Software Engineer' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'SE' })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({
    example: 'Writes system software code and unit tests',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 0, required: false })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiProperty({ enum: Status, example: Status.ACTIVE, required: false })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @ApiProperty({ example: 'uuid-department-id', required: false })
  @IsOptional()
  @IsUUID()
  departmentId?: string;
}

export class UpdateDesignationDto {
  @ApiProperty({ example: 'Senior Software Engineer', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'SSE', required: false })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({
    example: 'Designs architectures and codes core services',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiProperty({ enum: Status, example: Status.ACTIVE, required: false })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @ApiProperty({ example: 'uuid-department-id', required: false })
  @IsOptional()
  @IsUUID()
  departmentId?: string;
}
