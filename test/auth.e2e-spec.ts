import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { createHash } from 'crypto';

describe('Auth (e2e)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

    prisma = app.get<PrismaService>(PrismaService);

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  afterEach(async () => {
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.business.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test-register@example.com',
          password: 'password123',
          fullName: 'Test User',
          phone: '1234567890',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe('test-register@example.com');
      expect(response.body.isVerified).toBe(false);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should reject duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'duplicate-auth@example.com',
          password: 'password123',
          fullName: 'User One',
          phone: '1111111111',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'duplicate-auth@example.com',
          password: 'password456',
          fullName: 'User Two',
          phone: '2222222222',
        })
        .expect(409);
    });
  });

  describe('/auth/verify-email (GET)', () => {
    it('should verify email with valid token', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'verify-auth@example.com',
          password: 'password123',
          fullName: 'Verify User',
          phone: '3333333333',
        });

      // Set a known raw token and its hash in the DB
      const rawToken = 'test-verification-token-12345';
      const tokenHash = createHash('sha256').update(rawToken).digest('hex');

      await prisma.user.update({
        where: { email: 'verify-auth@example.com' },
        data: {
          emailVerificationTokenHash: tokenHash,
          emailVerificationExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/auth/verify-email?token=${rawToken}`)
        .expect(200);

      expect(response.body.message).toContain('verified');

      const verifiedUser = await prisma.user.findUnique({
        where: { email: 'verify-auth@example.com' },
      });
      expect(verifiedUser?.isVerified).toBe(true);
    });

    it('should reject invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/verify-email?token=invalid-token')
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login with verified user', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'login-auth@example.com',
          password: 'password123',
          fullName: 'Login User',
          phone: '4444444444',
        });

      await prisma.user.update({
        where: { email: 'login-auth@example.com' },
        data: { isVerified: true },
      });

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'login-auth@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body.user.email).toBe('login-auth@example.com');
    });

    it('should reject unverified user', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'unverified-auth@example.com',
          password: 'password123',
          fullName: 'Unverified User',
          phone: '5555555555',
        });

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'unverified-auth@example.com',
          password: 'password123',
        })
        .expect(403);
    });

    it('should reject invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });
});
