export class GetDevicePartitionsQuery {
  constructor(
    public readonly tenantId: string,
    public readonly deviceId: string,
    public readonly keys: string[],
  ) {}
}
