// test/device.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthService } from '../src/auth/auth.service';
import { BigIntInterceptor } from '../src/common/interceptors/bigint.interceptors';

describe('DeviceController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authService: AuthService;
  let jwtToken: string;

  // Constants from the demo deployment
  const DEMO_CUSTOMER_ID = '13814000-1dd2-11b2-8080-808080808080';
  const THERMOSTAT_PROFILE_ID = '3d35bb90-a654-11ef-ab03-e3df7acc322a';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    authService = app.get<AuthService>(AuthService);

    // Apply the same configuration as in main.ts
    app.enableVersioning({
      type: VersioningType.URI,
      prefix: 'v',
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    app.useGlobalInterceptors(new BigIntInterceptor());

    await app.init();

    // Get default tenant admin user
    const tenantAdmin = await prisma.tb_user.findFirst({
      where: {
        authority: 'TENANT_ADMIN',
        email: 'tenant@thingsboard.org',
      },
    });

    if (!tenantAdmin) {
      throw new Error('Default tenant admin not found');
    }

    // Generate JWT for tenant admin
    jwtToken = await authService.generateToken(
      tenantAdmin.id,
      tenantAdmin.email,
    );
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/v1/devices (GET)', () => {
    it('should require authentication', () => {
      return request(app.getHttpServer()).get('/v1/devices').expect(401);
    });

    it('should get paginated devices with default settings', () => {
      return request(app.getHttpServer())
        .get('/v1/devices')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('devices');
          expect(res.body).toHaveProperty('pagination');
          expect(Array.isArray(res.body.devices)).toBe(true);
          expect(res.body.pagination.total).toBe(17); // Total from demo data
          expect(res.body.pagination.page).toBe(1);
          expect(res.body.pagination.limit).toBe(10);
          expect(res.body.pagination.totalPages).toBe(2);
        });
    });

    it('should filter devices by customer ID', () => {
      return request(app.getHttpServer())
        .get(`/v1/devices?customerId=${DEMO_CUSTOMER_ID}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.devices).toBeInstanceOf(Array);
          expect(
            res.body.devices.every(
              (device) => device.customer_id === DEMO_CUSTOMER_ID,
            ),
          ).toBe(true);
          expect(res.body.devices.length).toBe(10);
        });
    });

    it('should filter devices by type', () => {
      return request(app.getHttpServer())
        .get('/v1/devices?type=thermostat')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.devices).toBeInstanceOf(Array);
          expect(res.body.devices.length).toBe(5); // Five thermostat devices
          expect(
            res.body.devices.every((device) => device.type === 'thermostat'),
          ).toBe(true);
          expect(res.body.devices.map((d) => d.name).sort()).toEqual([
            'Thermostat T1',
            'Thermostat T2',
            'dev2',
            'dev3',
            'dev4',
          ]);
        });
    });

    it('should filter devices by profile ID', () => {
      return request(app.getHttpServer())
        .get(`/v1/devices?profileId=${THERMOSTAT_PROFILE_ID}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.devices).toBeInstanceOf(Array);
          expect(res.body.devices.length).toBe(5);
          expect(
            res.body.devices.every(
              (device) => device.device_profile.id === THERMOSTAT_PROFILE_ID,
            ),
          ).toBe(true);
          expect(
            res.body.devices.every(
              (device) => device.device_profile.name === 'thermostat',
            ),
          ).toBe(true);
        });
    });

    it('should handle pagination correctly', () => {
      return request(app.getHttpServer())
        .get('/v1/devices?pageSize=5&pageNumber=1')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.devices).toBeInstanceOf(Array);
          expect(res.body.devices.length).toBe(5);
          expect(res.body.pagination.limit).toBe(5);
          expect(res.body.pagination.page).toBe(1);
          expect(res.body.pagination.total).toBe(17);
          expect(res.body.pagination.totalPages).toBe(4);
        });
    });

    it('should return correct device structure', () => {
      return request(app.getHttpServer())
        .get('/v1/devices?type=thermostat')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200)
        .expect((res) => {
          const device = res.body.devices[0];
          expect(device).toHaveProperty('id');
          expect(device).toHaveProperty('name');
          expect(device).toHaveProperty('label');
          expect(device).toHaveProperty('type');
          expect(device).toHaveProperty('created_time');
          expect(device).toHaveProperty('customer_id');
          expect(device).toHaveProperty('device_profile');
          expect(device.device_profile).toHaveProperty('id');
          expect(device.device_profile).toHaveProperty('name');
          expect(device.device_profile).toHaveProperty('type');
          expect(device.device_profile).toHaveProperty('description');
        });
    });

    it('should fail with invalid pagination parameters', () => {
      return request(app.getHttpServer())
        .get('/v1/devices?pageNumber=0&pageSize=0')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(400);
    });
  });
});
