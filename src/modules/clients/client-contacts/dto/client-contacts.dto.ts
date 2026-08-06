import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, IsDateString } from 'class-validator';
import { Status } from '@prisma/client';

export class CreateClientContactDto {
  @ApiProperty({ example: 'uuid-client-id' })
  @IsNotEmpty()
  @IsUUID()
  clientId: string;

  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'CTO', required: false })
  @IsOptional()
  @IsString()
  designation?: string;

  @ApiProperty({ example: 'john.doe@acme.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+919876543210', required: false })
  @IsOptional()
  @IsString()
  mobile?: string;

  @ApiProperty({ example: '+912233445566', required: false })
  @IsOptional()
  @IsString()
  officePhone?: string;

  @ApiProperty({ example: '+919876543210', required: false })
  @IsOptional()
  @IsString()
  whatsApp?: string;

  @ApiProperty({ example: '1985-05-15', required: false })
  @IsOptional()
  @IsDateString()
  birthday?: string;

  @ApiProperty({ example: 'Primary technical contact', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ enum: Status, example: Status.ACTIVE, required: false })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiProperty({ example: 'https://linkedin.com/in/johndoe', required: false })
  @IsOptional()
  @IsString()
  linkedIn?: string;

  @ApiProperty({ example: 'Email', required: false })
  @IsOptional()
  @IsString()
  preferredContactMethod?: string;

  @ApiProperty({ example: 'Afternoon 2 PM to 5 PM', required: false })
  @IsOptional()
  @IsString()
  preferredContactTime?: string;
}

export class UpdateClientContactDto {
  @ApiProperty({ example: 'John Doe', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'CTO', required: false })
  @IsOptional()
  @IsString()
  designation?: string;

  @ApiProperty({ example: 'john.doe@acme.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '+919876543210', required: false })
  @IsOptional()
  @IsString()
  mobile?: string;

  @ApiProperty({ example: '+912233445566', required: false })
  @IsOptional()
  @IsString()
  officePhone?: string;

  @ApiProperty({ example: '+919876543210', required: false })
  @IsOptional()
  @IsString()
  whatsApp?: string;

  @ApiProperty({ example: '1985-05-15', required: false })
  @IsOptional()
  @IsDateString()
  birthday?: string;

  @ApiProperty({ example: 'Primary technical contact', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ enum: Status, example: Status.ACTIVE, required: false })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiProperty({ example: 'https://linkedin.com/in/johndoe', required: false })
  @IsOptional()
  @IsString()
  linkedIn?: string;

  @ApiProperty({ example: 'Email', required: false })
  @IsOptional()
  @IsString()
  preferredContactMethod?: string;

  @ApiProperty({ example: 'Afternoon 2 PM to 5 PM', required: false })
  @IsOptional()
  @IsString()
  preferredContactTime?: string;
}
