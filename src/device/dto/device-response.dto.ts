export class DeviceProfileDto {
  id: string;
  name: string;
  type: string;
  description?: string;
  image?: string;
  default_dashboard_id?: string;
}

export class DeviceDto {
  id: string;
  name?: string;
  label?: string;
  type?: string;
  created_time: bigint;
  customer_id?: string;
  device_profile: DeviceProfileDto;
}

export class PaginatedDeviceResponse {
  data: DeviceDto[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}
