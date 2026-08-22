import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateWebhookDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  targetUrl: string;

  @ApiProperty({
    description:
      'Comma-separated event types, e.g. "task.created,invoice.paid"',
  })
  @IsNotEmpty()
  @IsString()
  eventTypes: string;
}
