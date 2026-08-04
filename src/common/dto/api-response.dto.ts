import { ApiProperty } from '@nestjs/swagger';

export class MetaDto {
  @ApiProperty()
  totalCount: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  hasNextPage: boolean;

  @ApiProperty()
  hasPreviousPage: boolean;
}

export class PaginatedResponseDto<T> {
  @ApiProperty({ default: true })
  success: boolean;

  @ApiProperty()
  statusCode: number;

  @ApiProperty()
  message: string;

  @ApiProperty({ type: MetaDto })
  meta: MetaDto;

  data: T[];

  @ApiProperty({ required: false })
  traceId?: string;
}

export class SuccessResponseDto<T> {
  @ApiProperty({ default: true })
  success: boolean;

  @ApiProperty()
  statusCode: number;

  @ApiProperty()
  message: string;

  data: T;

  @ApiProperty({ required: false })
  traceId?: string;
}
