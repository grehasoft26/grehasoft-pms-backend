import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'Project Manager' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: 'Manages project deliverables and client communications',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;

  @ApiProperty({ example: 'uuid-parent-role-id', required: false })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}

export class UpdateRoleDto {
  @ApiProperty({ example: 'Senior Project Manager', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    example: 'Oversees multiple projects portfolios',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'uuid-parent-role-id', required: false })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}

export class AssignPermissionsDto {
  @ApiProperty({ example: ['uuid-permission-id-1', 'uuid-permission-id-2'] })
  @IsNotEmpty()
  @IsArray()
  @IsUUID(undefined, { each: true })
  permissionIds: string[];
}
