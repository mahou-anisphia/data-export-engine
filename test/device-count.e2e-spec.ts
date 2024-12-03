// test/device-counts.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthService } from '../src/auth/auth.service';

describe('Device Counts (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authService: AuthService;
  let jwtToken: string;

  // Constants from demo deployment
  const DEMO_CUSTOMER_ID = '13814000-1dd2-11b2-8080-808080808080';
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

  describe('/devices/count (GET)', () => {
    it('should require authentication', () => {
      return request(app.getHttpServer()).get('/devices/count').expect(401);
    });

    it('should return total device counts and breakdowns', () => {
      return request(app.getHttpServer())
        .get('/devices/count')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('total', 17);
          expect(res.body).toHaveProperty('by_type');
          expect(res.body).toHaveProperty('by_profile');

          // Verify type breakdown
          expect(res.body.by_type).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                type: 'default',
                count: 11,
              }),
              expect.objectContaining({
                type: 'thermostat',
                count: 5,
              }),
              expect.objectContaining({
                type: 'Oring',
                count: 1,
              }),
            ]),
          );

          // Verify profile breakdown
          expect(res.body.by_profile).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                profile_id: DEFAULT_PROFILE_ID,
                profile_name: 'default',
                count: 11,
              }),
              expect.objectContaining({
                profile_id: THERMOSTAT_PROFILE_ID,
                profile_name: 'thermostat',
                count: 5,
              }),
            ]),
          );
        });
    });

    it('should return counts filtered by customer ID', () => {
      return request(app.getHttpServer())
        .get(`/devices/count?customerId=${DEMO_CUSTOMER_ID}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.total).toBe(12); // Demo customer has 10 devices

          const defaultProfileCount = res.body.by_profile.find(
            (p) => p.profile_id === DEFAULT_PROFILE_ID,
          )?.count;
          expect(defaultProfileCount).toBe(6);

          const thermostatProfileCount = res.body.by_profile.find(
            (p) => p.profile_id === THERMOSTAT_PROFILE_ID,
          )?.count;
          expect(thermostatProfileCount).toBe(5);
        });
    });
  });
});
