export class GetDeviceLatestTelemetryQuery {
  constructor(
    public readonly tenantId: string,
    public readonly deviceId: string,
  ) {}
}
