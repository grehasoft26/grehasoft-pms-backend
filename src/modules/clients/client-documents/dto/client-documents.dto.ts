import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { DocumentCategory } from '@prisma/client';

export class CreateClientDocumentDto {
  @ApiProperty({ example: 'uuid-client-id' })
  @IsNotEmpty()
  @IsUUID()
  clientId: string;

  @ApiProperty({ enum: DocumentCategory, example: DocumentCategory.CONTRACT })
  @IsNotEmpty()
  @IsEnum(DocumentCategory)
  category: DocumentCategory;

  @ApiProperty({ example: '1.0', required: false })
  @IsOptional()
  @IsString()
  documentVersion?: string;

  @ApiProperty({ example: '2027-12-31', required: false })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiProperty({ example: '2027-11-30', required: false })
  @IsOptional()
  @IsDateString()
  reminderDate?: string;
}

export class UpdateClientDocumentDto {
  @ApiProperty({
    enum: DocumentCategory,
    example: DocumentCategory.NDA,
    required: false,
  })
  @IsOptional()
  @IsEnum(DocumentCategory)
  category?: DocumentCategory;

  @ApiProperty({ example: '1.1', required: false })
  @IsOptional()
  @IsString()
  documentVersion?: string;

  @ApiProperty({ example: '2027-12-31', required: false })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiProperty({ example: '2027-11-30', required: false })
  @IsOptional()
  @IsDateString()
  reminderDate?: string;
}
