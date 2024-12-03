// src/device/queries/impl/get-devices.query.ts
/**
 * Query to get paginated list of devices
 */
export class GetDevicesQuery {
  constructor(
    public readonly tenantId: string,
    public readonly pageSize: number = 10,
    public readonly pageNumber: number = 1,
    public readonly customerId?: string,
    public readonly type?: string,
    public readonly profileId?: string,
  ) {}
}
