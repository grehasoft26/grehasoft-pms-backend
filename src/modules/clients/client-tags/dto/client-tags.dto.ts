import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateClientTagDto {
  @ApiProperty({ example: 'VIP' })
  @IsNotEmpty()
  @IsString()
  name: string;
}
