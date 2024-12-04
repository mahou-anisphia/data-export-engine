import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Client, types } from 'cassandra-driver';

@Injectable()
export class CassandraService implements OnModuleInit, OnModuleDestroy {
  private client: Client;

  constructor() {
    this.client = new Client({
      contactPoints: [process.env.CASSANDRA_URL],
      localDataCenter: 'datacenter1',
      keyspace: 'thingsboard',
    });
  }

  async onModuleInit() {
    await this.client.connect();
  }

  async onModuleDestroy() {
    await this.client.shutdown();
  }

  getClient(): Client {
    return this.client;
  }

  async executeQuery(
    query: string,
    params: any[] = [],
  ): Promise<types.ResultSet> {
    return this.client.execute(query, params, { prepare: true });
  }
}
