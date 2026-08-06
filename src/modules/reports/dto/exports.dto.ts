import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum, IsUUID } from 'class-validator';
import { ExportFormat } from '@prisma/client';

export class TriggerExportDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  reportDefinitionId: string;

  @ApiProperty({ enum: ExportFormat })
  @IsNotEmpty()
  @IsEnum(ExportFormat)
  exportFormat: ExportFormat;
}
