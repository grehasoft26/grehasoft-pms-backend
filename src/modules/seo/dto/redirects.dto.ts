import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { RedirectType } from '@prisma/client';

export class CreateRedirectDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  sourcePath: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  targetPath: string;

  @ApiProperty({ enum: RedirectType, default: 'R301' })
  @IsNotEmpty()
  @IsEnum(RedirectType)
  type: RedirectType;
}
