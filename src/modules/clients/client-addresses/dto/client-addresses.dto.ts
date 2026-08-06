import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { AddressType } from '@prisma/client';

export class CreateClientAddressDto {
  @ApiProperty({ example: 'uuid-client-id' })
  @IsNotEmpty()
  @IsUUID()
  clientId: string;

  @ApiProperty({ enum: AddressType, example: AddressType.BILLING })
  @IsNotEmpty()
  @IsEnum(AddressType)
  type: AddressType;

  @ApiProperty({ example: '123 Main Street' })
  @IsNotEmpty()
  @IsString()
  addressLine1: string;

  @ApiProperty({ example: 'Suite 400', required: false })
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiProperty({ example: 'Mumbai' })
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiProperty({ example: 'Maharashtra', required: false })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ example: '400001' })
  @IsNotEmpty()
  @IsString()
  postalCode: string;

  @ApiProperty({ example: 'India' })
  @IsNotEmpty()
  @IsString()
  country: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiProperty({ example: 19.0760, required: false })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({ example: 72.8777, required: false })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({ example: 'https://maps.google.com/?q=19.0760,72.8777', required: false })
  @IsOptional()
  @IsString()
  googleMapsUrl?: string;
}

export class UpdateClientAddressDto {
  @ApiProperty({ enum: AddressType, example: AddressType.BILLING, required: false })
  @IsOptional()
  @IsEnum(AddressType)
  type?: AddressType;

  @ApiProperty({ example: '123 Main Street', required: false })
  @IsOptional()
  @IsString()
  addressLine1?: string;

  @ApiProperty({ example: 'Suite 400', required: false })
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiProperty({ example: 'Mumbai', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ example: 'Maharashtra', required: false })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ example: '400001', required: false })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiProperty({ example: 'India', required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiProperty({ example: 19.0760, required: false })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({ example: 72.8777, required: false })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({ example: 'https://maps.google.com/?q=19.0760,72.8777', required: false })
  @IsOptional()
  @IsString()
  googleMapsUrl?: string;
}
