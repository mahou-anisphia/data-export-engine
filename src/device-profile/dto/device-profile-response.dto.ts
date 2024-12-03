// src/device-profile/dto/device-profile-response.dto.ts
export class DeviceProfileResponseDto {
  id: string;
  name: string;
  type: string;
  description?: string;
  image?: string;
  transport_type?: string;
  provision_type?: string;
  is_default: boolean;
  default_dashboard_id?: string;
  default_queue_name?: string;
  created_time: bigint;
}
