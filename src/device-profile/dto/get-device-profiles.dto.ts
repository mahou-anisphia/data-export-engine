// src/device-profile/dto/get-device-profiles.dto.ts
import { IsOptional, IsString } from 'class-validator';

export class GetDeviceProfilesDto {
  @IsOptional()
  @IsString()
  type?: string;
}
