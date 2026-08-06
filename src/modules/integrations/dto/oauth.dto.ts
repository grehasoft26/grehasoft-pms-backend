import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateOAuthAppDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Comma-separated redirect URIs' })
  @IsNotEmpty()
  @IsString()
  redirectUris: string;
}
