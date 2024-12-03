// test/device-profile-counts.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthService } from '../src/auth/auth.service';

describe('Device Profile Counts (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authService: AuthService;
  let jwtToken: string;

  // Constants from demo deployment
  const DEFAULT_PROFILE_ID = '3bdd3070-a654-11ef-ab03-e3df7acc322a';
  const THERMOSTAT_PROFILE_ID = '3d35bb90-a654-11ef-ab03-e3df7acc322a';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    authService = app.get<AuthService>(AuthService);
    await app.init();

    // Get default tenant admin user and generate JWT
    const tenantAdmin = await prisma.tb_user.findFirst({
      where: {
        authority: 'TENANT_ADMIN',
        email: 'tenant@thingsboard.org',
      },
    });

    if (!tenantAdmin) {
      throw new Error('Default tenant admin not found');
    }

    jwtToken = await authService.generateToken(
      tenantAdmin.id,
      tenantAdmin.email,
    );
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/device-profiles/count (GET)', () => {
    it('should require authentication', () => {
      return request(app.getHttpServer())
        .get('/device-profiles/count')
        .expect(401);
    });

    it('should return profile counts with device distribution', () => {
      return request(app.getHttpServer())
        .get('/device-profiles/count')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('total_profiles', 5);
          expect(res.body).toHaveProperty('total_devices', 17);
          expect(res.body).toHaveProperty('profiles');
          expect(res.body.profiles).toHaveLength(5);

          // Verify default profile
          const defaultProfile = res.body.profiles.find(
            (p) => p.id === DEFAULT_PROFILE_ID,
          );
          expect(defaultProfile).toBeDefined();
          expect(defaultProfile).toMatchObject({
            name: 'default',
            type: 'DEFAULT',
            is_default: true,
            device_count: 11,
          });

          // Verify thermostat profile
          const thermostatProfile = res.body.profiles.find(
            (p) => p.id === THERMOSTAT_PROFILE_ID,
          );
          expect(thermostatProfile).toBeDefined();
          expect(thermostatProfile).toMatchObject({
            name: 'thermostat',
            type: 'DEFAULT',
            is_default: false,
            device_count: 5,
          });
        });
    });

    it('should have consistent total counts', () => {
      return request(app.getHttpServer())
        .get('/device-profiles/count')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200)
        .expect((res) => {
          const sumOfDeviceCounts = res.body.profiles.reduce(
            (sum, profile) => sum + profile.device_count,
            0,
          );
          expect(sumOfDeviceCounts).toBe(res.body.total_devices);
        });
    });
  });
});
