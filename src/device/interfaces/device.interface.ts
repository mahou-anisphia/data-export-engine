// src/device/interfaces/device.interface.ts
export interface IDevice {
  id: string;
  created_time: bigint;
  additional_info?: string;
  customer_id?: string;
  device_profile_id: string;
  device_data?: any;
  type?: string;
  name?: string;
  label?: string;
  tenant_id?: string;
  firmware_id?: string;
  software_id?: string;
  external_id?: string;
}
