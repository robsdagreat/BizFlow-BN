import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Products (e2e)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let businessId: string;

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
        email: 'seller-product@example.com',
        password: 'password123',
        fullName: 'Seller User',
        phone: '1234567890',
      });

    if (registerResponse.status !== 201) {
      throw new Error(`Register failed with status ${registerResponse.status}: ${JSON.stringify(registerResponse.body)}`);
    }

    await prisma.user.update({
      where: { email: 'seller-product@example.com' },
      data: { isVerified: true, role: 'SELLER' },
    });

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'seller-product@example.com',
        password: 'password123',
      });

    accessToken = loginResponse.body.access_token;

    const businessResponse = await request(app.getHttpServer())
      .post('/businesses')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Test Business',
        description: 'Test',
        category: 'Tech',
        city: 'NYC',
      });

    businessId = businessResponse.body.id;
  });

  describe('/products (POST)', () => {
    it('should create a product', async () => {
      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          businessId,
          name: 'Test Product',
          description: 'A test product',
          price: 99.99,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test Product');
      expect(response.body.price).toBe(99.99);
      expect(response.body.isActive).toBe(true);
      expect(response.body.businessId).toBe(businessId);
    });

    it('should activate business when first product is created', async () => {
      await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          businessId,
          name: 'First Product',
          description: 'First',
          price: 50,
        });

      const business = await prisma.business.findUnique({
        where: { id: businessId },
      });

      expect(business?.isVisible).toBe(true);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/products')
        .send({
          businessId,
          name: 'Test Product',
          price: 99.99,
        })
        .expect(401);
    });
  });

  describe('/products/:id (PATCH)', () => {
    it('should update product', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          businessId,
          name: 'Original Product',
          price: 50,
        });

      const productId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .patch(`/products/${productId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Updated Product',
          price: 75,
        })
        .expect(200);

      expect(response.body.name).toBe('Updated Product');
      expect(response.body.price).toBe(75);
    });

    it('should deactivate business when all products are inactive', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          businessId,
          name: 'Product',
          price: 50,
        });

      const productId = createResponse.body.id;

      await request(app.getHttpServer())
        .patch(`/products/${productId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          isActive: false,
        });

      const business = await prisma.business.findUnique({
        where: { id: businessId },
      });

      expect(business?.isVisible).toBe(false);
    });
  });

  describe('/products/:id (DELETE)', () => {
    it('should delete product', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          businessId,
          name: 'Product to Delete',
          price: 50,
        });

      const productId = createResponse.body.id;

      await request(app.getHttpServer())
        .delete(`/products/${productId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      expect(product).toBeNull();
    });
  });

  describe('/businesses/:slug (GET)', () => {
    it('should get business with products by slug', async () => {
      await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          businessId,
          name: 'Product 1',
          price: 50,
        });

      await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          businessId,
          name: 'Product 2',
          price: 75,
        });

      const response = await request(app.getHttpServer())
        .get('/businesses/test-business')
        .expect(200);

      expect(response.body.name).toBe('Test Business');
      expect(response.body.products).toHaveLength(2);
    });
  });
});
