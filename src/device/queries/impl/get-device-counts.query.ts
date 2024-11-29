export class GetDeviceCountsQuery {
  constructor(
    public readonly tenantId: string,
    public readonly customerId?: string,
  ) {}
}
