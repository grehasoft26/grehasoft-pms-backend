import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreatePermissionGroupDto {
  @ApiProperty({ example: 'CRM' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'Customer Relationship Management Module', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreatePermissionCategoryDto {
  @ApiProperty({ example: 'Leads' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'Lead administration permission category', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'uuid-group-id' })
  @IsNotEmpty()
  @IsUUID()
  groupId: string;
}

export class CreatePermissionDto {
  @ApiProperty({ example: 'Create Lead' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'leads.create' })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({ example: 'uuid-category-id' })
  @IsNotEmpty()
  @IsUUID()
  categoryId: string;
}
