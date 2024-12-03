// test/device-profile.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthService } from '../src/auth/auth.service';

describe('DeviceProfileController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authService: AuthService;
  let jwtToken: string;

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
        email: 'tenant@thingsboard.org', // Default ThingsBoard tenant admin email
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

  describe('/device-profiles (GET)', () => {
    it('should require authentication', () => {
      return request(app.getHttpServer()).get('/device-profiles').expect(401);
    });

    it('should get all device profiles including default', () => {
      return request(app.getHttpServer())
        .get('/device-profiles')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('profiles');
          expect(res.body).toHaveProperty('pagination');
          expect(Array.isArray(res.body.profiles)).toBe(true);
          expect(res.body.profiles.length).toBeGreaterThan(0);
          expect(res.body.profiles[0]).toHaveProperty('id');
          expect(res.body.profiles[0]).toHaveProperty('name');
          expect(res.body.profiles[0]).toHaveProperty('type');
          // Verify default profile exists
          expect(res.body.profiles.some((profile) => profile.is_default)).toBe(
            true,
          );
        });
    });

    it('should return ordered by created_time in descending order', async () => {
      const response = await request(app.getHttpServer())
        .get('/device-profiles')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      const timestamps = response.body.profiles.map((profile) =>
        Number(profile.created_time),
      );
      const isSorted = timestamps.every((timestamp, index) => {
        if (index === 0) return true;
        return timestamp <= Number(timestamps[index - 1]);
      });

      expect(isSorted).toBe(true);
    });

    it('should include all required fields in the response', () => {
      return request(app.getHttpServer())
        .get('/device-profiles')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200)
        .expect((res) => {
          const profile = res.body.profiles[0];
          expect(profile).toHaveProperty('id');
          expect(profile).toHaveProperty('name');
          expect(profile).toHaveProperty('type');
          expect(profile).toHaveProperty('description');
          expect(profile).toHaveProperty('is_default');
          expect(profile).toHaveProperty('transport_type');
          expect(profile).toHaveProperty('provision_type');
          expect(profile).toHaveProperty('created_time');
        });
    });
  });
});
