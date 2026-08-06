import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { SchemaType } from '@prisma/client';

export class CreateSchemaDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  urlPath: string;

  @ApiProperty({ enum: SchemaType })
  @IsNotEmpty()
  @IsEnum(SchemaType)
  type: SchemaType;

  @ApiProperty({ description: 'Raw JSON-LD string' })
  @IsNotEmpty()
  @IsString()
  jsonLdContent: string;
}
