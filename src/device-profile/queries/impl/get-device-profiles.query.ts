// src/device-profile/queries/impl/get-device-profiles.query.ts
export class GetDeviceProfilesQuery {
  constructor(
    public readonly tenantId: string,
    public readonly type?: string,
  ) {}
}
