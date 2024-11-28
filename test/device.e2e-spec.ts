// test/device.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthService } from '../src/auth/auth.service';

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

  describe('/devices (GET)', () => {
    it('should require authentication', () => {
      return request(app.getHttpServer()).get('/devices').expect(401);
    });

    it('should get paginated devices with default settings', () => {
      return request(app.getHttpServer())
        .get('/devices')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('meta');
          expect(res.body.data).toBeInstanceOf(Array);
          expect(res.body.meta.total).toBe(10); // Total from demo data
          expect(res.body.meta.page).toBe(1);
          expect(res.body.meta.pageSize).toBe(10);
          expect(res.body.meta.totalPages).toBe(1);
        });
    });

    it('should filter devices by customer ID', () => {
      return request(app.getHttpServer())
        .get(`/devices?customerId=${DEMO_CUSTOMER_ID}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeInstanceOf(Array);
          expect(
            res.body.data.every(
              (device) => device.customer_id === DEMO_CUSTOMER_ID,
            ),
          ).toBe(true);
          // Demo customer has 5 devices: DHT11, Raspberry Pi, 2 Thermostats, and testdevice
          expect(res.body.data.length).toBe(5);
        });
    });

    it('should filter devices by type', () => {
      return request(app.getHttpServer())
        .get('/devices?type=thermostat')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeInstanceOf(Array);
          expect(res.body.data.length).toBe(2); // Two thermostat devices
          expect(
            res.body.data.every((device) => device.type === 'thermostat'),
          ).toBe(true);
          expect(res.body.data.map((d) => d.name).sort()).toEqual([
            'Thermostat T1',
            'Thermostat T2',
          ]);
        });
    });

    it('should filter devices by profile ID', () => {
      return request(app.getHttpServer())
        .get(`/devices?profileId=${THERMOSTAT_PROFILE_ID}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeInstanceOf(Array);
          expect(res.body.data.length).toBe(2);
          expect(
            res.body.data.every(
              (device) => device.device_profile.id === THERMOSTAT_PROFILE_ID,
            ),
          ).toBe(true);
          expect(
            res.body.data.every(
              (device) => device.device_profile.name === 'thermostat',
            ),
          ).toBe(true);
        });
    });

    it('should handle pagination correctly', () => {
      return request(app.getHttpServer())
        .get('/devices?pageSize=5&pageNumber=1')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeInstanceOf(Array);
          expect(res.body.data.length).toBe(5);
          expect(res.body.meta.pageSize).toBe(5);
          expect(res.body.meta.page).toBe(1);
          expect(res.body.meta.total).toBe(10);
          expect(res.body.meta.totalPages).toBe(2);
        });
    });

    it('should return correct device structure', () => {
      return request(app.getHttpServer())
        .get('/devices?type=thermostat')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200)
        .expect((res) => {
          const device = res.body.data[0];
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
  });
});
