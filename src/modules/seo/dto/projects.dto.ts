import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateSEOProjectDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  clientId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  projectId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  ownerId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  domain: string;
}
