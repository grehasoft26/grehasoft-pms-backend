import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsArray,
  IsUrl,
} from 'class-validator';
import { ClientStatus } from '@prisma/client';

export class CreateClientDto {
  @ApiProperty({ example: 'Acme Corp Inc.' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    enum: ClientStatus,
    example: ClientStatus.PROSPECT,
    required: false,
  })
  @IsOptional()
  @IsEnum(ClientStatus)
  status?: ClientStatus;

  @ApiProperty({ example: 'uuid-category-id' })
  @IsNotEmpty()
  @IsUUID()
  categoryId: string;

  @ApiProperty({ example: 'Technology', required: false })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiProperty({ example: 'Private Limited', required: false })
  @IsOptional()
  @IsString()
  companyType?: string;

  @ApiProperty({ example: 'https://acme.com', required: false })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiProperty({ example: '27AADCA3918D1ZS', required: false })
  @IsOptional()
  @IsString()
  gstVatNumber?: string;

  @ApiProperty({ example: 'ABCDE1234F', required: false })
  @IsOptional()
  @IsString()
  taxNumber?: string;

  @ApiProperty({ example: 'U72200MH2021PTC353456', required: false })
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiProperty({ example: 'https://acme.com/logo.png', required: false })
  @IsOptional()
  @IsString()
  profileLogo?: string;

  @ApiProperty({ example: 'Key enterprise account', required: false })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiProperty({ example: ['VIP', 'Enterprise'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateClientDto {
  @ApiProperty({ example: 'Acme Corp Inc.', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    enum: ClientStatus,
    example: ClientStatus.ACTIVE,
    required: false,
  })
  @IsOptional()
  @IsEnum(ClientStatus)
  status?: ClientStatus;

  @ApiProperty({ example: 'uuid-category-id', required: false })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ example: 'Technology', required: false })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiProperty({ example: 'Private Limited', required: false })
  @IsOptional()
  @IsString()
  companyType?: string;

  @ApiProperty({ example: 'https://acme.com', required: false })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiProperty({ example: '27AADCA3918D1ZS', required: false })
  @IsOptional()
  @IsString()
  gstVatNumber?: string;

  @ApiProperty({ example: 'ABCDE1234F', required: false })
  @IsOptional()
  @IsString()
  taxNumber?: string;

  @ApiProperty({ example: 'U72200MH2021PTC353456', required: false })
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiProperty({ example: 'https://acme.com/logo.png', required: false })
  @IsOptional()
  @IsString()
  profileLogo?: string;

  @ApiProperty({ example: 'Key enterprise account', required: false })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiProperty({ example: 'uuid-contact-id', required: false })
  @IsOptional()
  @IsUUID()
  primaryContactId?: string;

  @ApiProperty({ example: 'uuid-address-id', required: false })
  @IsOptional()
  @IsUUID()
  primaryAddressId?: string;

  @ApiProperty({ example: ['VIP', 'High-Growth'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class ClientFilterDto {
  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  page?: number;

  @ApiProperty({ required: false, example: 10 })
  @IsOptional()
  limit?: number;

  @ApiProperty({ required: false, example: 'Acme' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ enum: ClientStatus, required: false })
  @IsOptional()
  @IsEnum(ClientStatus)
  status?: ClientStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  companyType?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiProperty({ required: false, example: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}
