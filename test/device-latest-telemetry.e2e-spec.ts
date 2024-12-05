import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthService } from '@/auth/auth.service';
import { BigIntInterceptor } from '@/common/interceptors/bigint.interceptors';

describe('Device Latest Telemetry (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authService: AuthService;
  let accessToken: string;
  const deviceId = '98e28df0-a655-11ef-b85a-4de4157f3f25';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
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

    // Get access token for TENANT_ADMIN
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
    accessToken = await authService.generateToken(
      tenantAdmin.id,
      tenantAdmin.email,
    );
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /devices/:deviceId/latest-telemetry', () => {
    it('should return 401 for unauthorized request', () => {
      return request(app.getHttpServer())
        .get(`/v1/devices/${deviceId}/latest-telemetry`)
        .expect(401);
    });

    it('should return 404 for non-existent device', () => {
      const nonExistentDeviceId = '00000000-0000-0000-0000-000000000000';
      return request(app.getHttpServer())
        .get(`/v1/devices/${nonExistentDeviceId}/latest-telemetry`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return latest telemetry for existing device', () => {
      return request(app.getHttpServer())
        .get(`/v1/devices/${deviceId}/latest-telemetry`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('telemetry');
          expect(Array.isArray(res.body.telemetry)).toBe(true);

          // Each telemetry item should have the correct structure
          res.body.telemetry.forEach((item) => {
            expect(item).toHaveProperty('key');
            expect(item).toHaveProperty('value');
            expect(item).toHaveProperty('ts');
            expect(typeof item.key).toBe('string');
            expect(
              ['string', 'number', 'boolean'].includes(typeof item.value),
            ).toBe(true);
            expect(typeof item.ts).toBe('number');
          });

          // Verify specific telemetry keys exist
          const keys = res.body.telemetry.map((t) => t.key);
          expect(keys).toContain('temperature');
          expect(keys).toContain('humidity');
        });
    });
  });
});
