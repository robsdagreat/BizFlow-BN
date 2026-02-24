import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Businesses (e2e)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let userId: string;

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

  beforeEach(async () => {
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'seller-business@example.com',
        password: 'password123',
        fullName: 'Seller User',
        phone: '1234567890',
      });

    if (registerResponse.status !== 201) {
      throw new Error(`Register failed with status ${registerResponse.status}: ${JSON.stringify(registerResponse.body)}`);
    }

    userId = (await prisma.user.findUnique({ where: { email: 'seller-business@example.com' } }))!.id;

    await prisma.user.update({
      where: { id: userId },
      data: { isVerified: true, role: 'SELLER' },
    });

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'seller-business@example.com',
        password: 'password123',
      });

    accessToken = loginResponse.body.access_token;
  });

  describe('/businesses (POST)', () => {
    it('should create a business for verified user', async () => {
      const response = await request(app.getHttpServer())
        .post('/businesses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Business',
          description: 'A test business',
          category: 'Technology',
          city: 'New York',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test Business');
      expect(response.body.slug).toBe('test-business');
      expect(response.body).toHaveProperty('publicUrl');
      expect(response.body).toHaveProperty('qrCode');
      expect(response.body.isVisible).toBe(false);
    });

    it('should reject unverified user', async () => {
      await prisma.user.update({
        where: { id: userId },
        data: { isVerified: false },
      });

      await request(app.getHttpServer())
        .post('/businesses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Business',
          description: 'A test business',
          category: 'Technology',
          city: 'New York',
        })
        .expect(409);
    });

    it('should reject duplicate business for same user', async () => {
      await request(app.getHttpServer())
        .post('/businesses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'First Business',
          description: 'First',
          category: 'Tech',
          city: 'NYC',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/businesses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Second Business',
          description: 'Second',
          category: 'Tech',
          city: 'NYC',
        })
        .expect(409);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/businesses')
        .send({
          name: 'Test Business',
          description: 'A test business',
          category: 'Technology',
          city: 'New York',
        })
        .expect(401);
    });
  });

  describe('/businesses/my (GET)', () => {
    it('should get user business', async () => {
      await request(app.getHttpServer())
        .post('/businesses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'My Business',
          description: 'My test business',
          category: 'Tech',
          city: 'NYC',
        });

      const response = await request(app.getHttpServer())
        .get('/businesses/my-business')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.name).toBe('My Business');
      expect(response.body).toHaveProperty('products');
    });

    it('should return null if no business', async () => {
      const response = await request(app.getHttpServer())
        .get('/businesses/my-business')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toBeNull();
    });
  });

  describe('/businesses/:id (PATCH)', () => {
    it('should update business', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/businesses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Original Name',
          description: 'Original',
          category: 'Tech',
          city: 'NYC',
        });

      const businessId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .patch(`/businesses/${businessId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Updated Name',
          description: 'Updated description',
        })
        .expect(200);

      expect(response.body.name).toBe('Updated Name');
      expect(response.body.description).toBe('Updated description');
    });

    it('should reject unauthorized update', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/businesses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Business',
          description: 'Desc',
          category: 'Tech',
          city: 'NYC',
        });

      const businessId = createResponse.body.id;

      const otherUserResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'other-business@example.com',
          password: 'password123',
          fullName: 'Other User',
          phone: '0987654321',
        });

      await prisma.user.update({
        where: { email: 'other-business@example.com' },
        data: { isVerified: true, role: 'SELLER' },
      });

      const otherLoginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'other-business@example.com',
          password: 'password123',
        });

      await request(app.getHttpServer())
        .patch(`/businesses/${businessId}`)
        .set('Authorization', `Bearer ${otherLoginResponse.body.access_token}`)
        .send({
          name: 'Hacked Name',
        })
        .expect(403);
    });
  });
});
