export class GetDeviceTelemetryKeysQuery {
  constructor(
    public readonly tenantId: string,
    public readonly deviceId: string,
  ) {}
}
