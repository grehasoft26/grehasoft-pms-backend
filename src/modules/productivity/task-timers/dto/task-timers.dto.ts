import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, IsNumber, Min } from 'class-validator';

export class StartTimerDto {
  @ApiProperty({ description: 'Task ID' })
  @IsNotEmpty()
  @IsUUID()
  taskId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class HeartbeatTimerDto {
  @ApiProperty({ description: 'Current accumulated duration in seconds' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  accumulatedTime: number;
}
