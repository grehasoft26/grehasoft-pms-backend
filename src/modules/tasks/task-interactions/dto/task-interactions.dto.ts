import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, IsNumber, IsBoolean, Min } from 'class-validator';
import { DependencyType } from '@prisma/client';

export class CreateTaskChecklistDto {
  @ApiProperty({ description: 'Associated Task ID' })
  @IsNotEmpty()
  @IsUUID()
  taskId: string;

  @ApiProperty({ description: 'Title of the checklist' })
  @IsNotEmpty()
  @IsString()
  title: string;
}

export class CreateTaskChecklistItemDto {
  @ApiProperty({ description: 'Associated Checklist ID' })
  @IsNotEmpty()
  @IsUUID()
  checklistId: string;

  @ApiProperty({ description: 'Item title text' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;
}

export class UpdateTaskChecklistItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;
}

export class CreateTaskCommentDto {
  @ApiProperty({ description: 'Associated Task ID' })
  @IsNotEmpty()
  @IsUUID()
  taskId: string;

  @ApiProperty({ description: 'Markdown body content' })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: 'Parent Comment ID for nested threaded replies' })
  @IsOptional()
  @IsUUID()
  parentCommentId?: string;
}

export class CreateTaskAttachmentDto {
  @ApiProperty({ description: 'Associated Task ID' })
  @IsNotEmpty()
  @IsUUID()
  taskId: string;

  @ApiProperty({ description: 'Name of the attached file' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'File key key from file upload storage' })
  @IsNotEmpty()
  @IsString()
  fileKey: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  fileSize?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mimeType?: string;
}

export class AddWatcherDto {
  @ApiProperty({ description: 'Associated Task ID' })
  @IsNotEmpty()
  @IsUUID()
  taskId: string;

  @ApiProperty({ description: 'User ID to enroll as watcher' })
  @IsNotEmpty()
  @IsUUID()
  userId: string;
}

export class AddTaskDependencyDto {
  @ApiProperty({ description: 'Associated Task ID' })
  @IsNotEmpty()
  @IsUUID()
  taskId: string;

  @ApiProperty({ description: 'Task ID that this task depends on' })
  @IsNotEmpty()
  @IsUUID()
  dependsOnTaskId: string;

  @ApiProperty({ enum: DependencyType, default: DependencyType.FS })
  @IsNotEmpty()
  @IsEnum(DependencyType)
  type: DependencyType;
}
