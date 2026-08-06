import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class RegisterWebhookDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsUrl()
  targetUrl: string;

  @ApiProperty({ description: 'Comma-separated events e.g. task.completed,invoice.paid' })
  @IsNotEmpty()
  @IsString()
  eventTypes: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  secretToken: string;
}
