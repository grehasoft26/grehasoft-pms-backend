import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class AssignProjectMemberDto {
  @ApiProperty({ description: 'Project ID' })
  @IsNotEmpty()
  @IsUUID()
  projectId: string;

  @ApiProperty({ description: 'User ID to assign' })
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Role within project (e.g. PM, QA, Developer, Client)', default: 'Developer' })
  @IsNotEmpty()
  @IsString()
  role: string;
}

export class UpdateProjectMemberDto {
  @ApiProperty({ description: 'New role' })
  @IsNotEmpty()
  @IsString()
  role: string;
}
