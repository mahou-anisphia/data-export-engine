// src/device-profile/queries/impl/get-device-profiles.query.ts
export class GetDeviceProfilesQuery {
  constructor(
    public readonly tenantId: string,
    public readonly pageSize: number = 10,
    public readonly pageNumber: number = 1,
    public readonly type?: string,
  ) {}
}
