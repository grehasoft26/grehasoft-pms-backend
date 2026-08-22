import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsArray,
} from 'class-validator';
import { NoteType } from '@prisma/client';

export class CreateClientNoteDto {
  @ApiProperty({ example: 'uuid-client-id' })
  @IsNotEmpty()
  @IsUUID()
  clientId: string;

  @ApiProperty({ example: 'Meeting Notes', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ example: 'Discussed project roadmap and timeline updates.' })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty({ enum: NoteType, example: NoteType.INTERNAL, required: false })
  @IsOptional()
  @IsEnum(NoteType)
  type?: NoteType;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  pinned?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  private?: boolean;

  @ApiProperty({ example: ['uuid-user-1', 'uuid-user-2'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mentions?: string[];

  @ApiProperty({ example: ['general/attach-1.jpg'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachmentsReference?: string[];
}

export class UpdateClientNoteDto {
  @ApiProperty({ example: 'Meeting Notes', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    example: 'Discussed project roadmap and timeline updates.',
    required: false,
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ enum: NoteType, example: NoteType.FOLLOW_UP, required: false })
  @IsOptional()
  @IsEnum(NoteType)
  type?: NoteType;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  pinned?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  private?: boolean;

  @ApiProperty({ example: ['uuid-user-1'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mentions?: string[];

  @ApiProperty({
    example: ['general/attach-1.jpg', 'general/attach-2.jpg'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachmentsReference?: string[];
}
