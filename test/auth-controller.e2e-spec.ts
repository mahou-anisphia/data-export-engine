// test/auth-controller.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { BigIntInterceptor } from '../src/common/interceptors/bigint.interceptors';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  // Use existing ThingsBoard user credentials
  const thingsboardUser = {
    email: 'tenant@thingsboard.org',
    password: 'tenant',
    id: '3c89c420-a654-11ef-ab03-e3df7acc322a', // The ID from your response
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/v1/auth/login (POST)', () => {
    it('should authenticate thingsboard user and return token', () => {
      return request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          email: thingsboardUser.email,
          password: thingsboardUser.password,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user).toHaveProperty('id', thingsboardUser.id);
          expect(res.body.user).toHaveProperty('email', thingsboardUser.email);
        });
    });

    it('should fail with incorrect password', () => {
      return request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          email: thingsboardUser.email,
          password: 'wrong-password',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body).toHaveProperty('message', 'Invalid credentials');
        });
    });

    it('should fail with non-existent email', () => {
      return request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: thingsboardUser.password,
        })
        .expect(401)
        .expect((res) => {
          expect(res.body).toHaveProperty('message', 'Invalid credentials');
        });
    });

    it('should fail with invalid email format', () => {
      return request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          email: 'invalid-email',
          password: thingsboardUser.password,
        })
        .expect(400);
    });
  });

  describe('/v1/auth/profile (GET)', () => {
    let authToken: string;

    beforeEach(async () => {
      // Get auth token before profile tests
      const loginResponse = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          email: thingsboardUser.email,
          password: thingsboardUser.password,
        });

      authToken = loginResponse.body.access_token;
    });

    it('should get user profile with valid token', () => {
      return request(app.getHttpServer())
        .get('/v1/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', thingsboardUser.id);
          expect(res.body).toHaveProperty('email', thingsboardUser.email);
          expect(res.body).toHaveProperty('createdTime');
          expect(res.body).toHaveProperty('additionalInfo');

          // Verify additionalInfo structure
          const additionalInfo = JSON.parse(res.body.additionalInfo);
          expect(additionalInfo).toHaveProperty('failedLoginAttempts');
          expect(additionalInfo).toHaveProperty('lastLoginTs');
        });
    });

    it('should fail without auth token', () => {
      return request(app.getHttpServer()).get('/v1/auth/profile').expect(401);
    });

    it('should fail with invalid auth token', () => {
      return request(app.getHttpServer())
        .get('/v1/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    // Test the exact response structure
    it('should return the exact profile structure', () => {
      return request(app.getHttpServer())
        .get('/v1/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          // Test exact structure based on your example response
          expect(res.body).toMatchObject({
            id: thingsboardUser.id,
            email: thingsboardUser.email,
            firstName: null,
            lastName: null,
            phone: null,
          });

          // Verify createdTime is a string (BigInt)
          expect(typeof res.body.createdTime).toBe('string');

          // Verify additionalInfo is a valid JSON string
          expect(() => JSON.parse(res.body.additionalInfo)).not.toThrow();

          const additionalInfo = JSON.parse(res.body.additionalInfo);
          expect(additionalInfo).toHaveProperty('failedLoginAttempts');
          expect(typeof additionalInfo.failedLoginAttempts).toBe('number');
          expect(additionalInfo).toHaveProperty('lastLoginTs');
          expect(typeof additionalInfo.lastLoginTs).toBe('number');
        });
    });
  });
  describe('/v1/auth/users/count (GET)', () => {
    let authToken: string;

    beforeEach(async () => {
      // Get auth token before tests
      const loginResponse = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          email: thingsboardUser.email,
          password: thingsboardUser.password,
        });

      authToken = loginResponse.body.access_token;
    });

    it('should return the total number of users', () => {
      return request(app.getHttpServer())
        .get('/v1/auth/users/count')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('count');
          expect(typeof res.body.count).toBe('number');
          expect(res.body.count).toBeGreaterThan(0);
        });
    });

    it('should fail without auth token', () => {
      return request(app.getHttpServer())
        .get('/v1/auth/users/count')
        .expect(401);
    });
  });
  describe('/v1/auth/users (GET)', () => {
    let authToken: string;

    beforeEach(async () => {
      // Get auth token before users tests
      const loginResponse = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          email: thingsboardUser.email,
          password: thingsboardUser.password,
        });

      authToken = loginResponse.body.access_token;
    });

    it('should get list of users with pagination', () => {
      return request(app.getHttpServer())
        .get('/v1/auth/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('users');
          expect(res.body).toHaveProperty('pagination');
          expect(Array.isArray(res.body.users)).toBe(true);

          // Check first user structure
          if (res.body.users.length > 0) {
            const user = res.body.users[0];
            expect(user).toHaveProperty('id');
            expect(user).toHaveProperty('email');
            expect(user).toHaveProperty('firstName');
            expect(user).toHaveProperty('lastName');
            expect(user).toHaveProperty('phone');
            expect(user).toHaveProperty('createdTime');
            expect(user).toHaveProperty('additionalInfo');
            expect(typeof user.createdTime).toBe('string');
            expect(() => JSON.parse(user.additionalInfo)).not.toThrow();
          }

          // Check pagination structure
          expect(res.body.pagination).toMatchObject({
            total: expect.any(Number),
            page: expect.any(Number),
            limit: expect.any(Number),
            totalPages: expect.any(Number),
          });
        });
    });

    it('should respect pagination parameters', () => {
      return request(app.getHttpServer())
        .get('/v1/auth/users?pageNumber=1&pageSize=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.users.length).toBeLessThanOrEqual(5);
          expect(res.body.pagination).toMatchObject({
            page: 1,
            limit: 5,
          });
        });
    });

    it('should fail with invalid pagination parameters', () => {
      return request(app.getHttpServer())
        .get('/v1/auth/users?page=0&limit=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should fail without auth token', () => {
      return request(app.getHttpServer()).get('/v1/auth/users').expect(401);
    });
  });
});
