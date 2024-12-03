// src/device-profile/dto/get-device-profiles.dto.ts
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GetDeviceProfilesDto {
  @ApiProperty({
    description: 'Number of items per page',
    minimum: 1,
    maximum: 100,
    default: 10,
    required: false,
  })
  @Type(() => Number)
  @IsInt({ message: 'Page size must be an integer' })
  @Min(1, { message: 'Page size must be greater than 0' })
  @Max(100, { message: 'Page size cannot exceed 100' })
  pageSize: number = 10;

  @ApiProperty({
    description: 'Page number for pagination',
    minimum: 1,
    default: 1,
    required: false,
  })
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be greater than 0' })
  pageNumber: number = 1;

  @ApiProperty({
    description: 'Filter profiles by type',
    required: false,
  })
  @IsOptional()
  @IsString()
  type?: string;
}
