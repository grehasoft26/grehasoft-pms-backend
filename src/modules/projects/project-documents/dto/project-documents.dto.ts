import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ProjectDocumentCategory } from '@prisma/client';

export class CreateProjectDocumentDto {
  @ApiProperty({ description: 'Associated Project ID' })
  @IsNotEmpty()
  @IsUUID()
  projectId: string;

  @ApiProperty({ description: 'Name of the document' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'File key pointing to local/remote storage file location',
  })
  @IsNotEmpty()
  @IsString()
  fileKey: string;

  @ApiProperty({
    enum: ProjectDocumentCategory,
    default: ProjectDocumentCategory.OTHER,
  })
  @IsNotEmpty()
  @IsEnum(ProjectDocumentCategory)
  category: ProjectDocumentCategory;
}
