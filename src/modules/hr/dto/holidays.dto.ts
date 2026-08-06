import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsDateString } from 'class-validator';

export class CreateHolidayDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'NATIONAL, COMPANY, REGIONAL, OPTIONAL' })
  @IsNotEmpty()
  @IsString()
  type: string;
}
