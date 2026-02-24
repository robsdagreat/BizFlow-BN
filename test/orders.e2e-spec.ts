import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

describe('Orders (e2e)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let businessId: string;
  let productId: string;

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
        email: 'seller-order@example.com',
        password: 'password123',
        fullName: 'Seller User',
        phone: '1234567890',
      });

    if (registerResponse.status !== 201) {
      throw new Error(`Register failed with status ${registerResponse.status}: ${JSON.stringify(registerResponse.body)}`);
    }

    await prisma.user.update({
      where: { email: 'seller-order@example.com' },
      data: { isVerified: true, role: 'SELLER' },
    });

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'seller-order@example.com',
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

    if (businessResponse.status !== 201) {
      throw new Error(`Business creation failed: ${businessResponse.status} ${JSON.stringify(businessResponse.body)}`);
    }

    businessId = businessResponse.body.id;

    const productResponse = await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        businessId,
        name: 'Test Product',
        price: 100,
      });

    if (productResponse.status !== 201) {
      throw new Error(`Product creation failed: ${productResponse.status} ${JSON.stringify(productResponse.body)}`);
    }

    productId = productResponse.body.id;
  });

  describe('/orders (POST)', () => {
    it('should create order without authentication', async () => {
      const response = await request(app.getHttpServer())
        .post('/orders')
        .send({
          businessId,
          customerName: 'John Doe',
          customerPhone: '1234567890',
          items: [
            {
              productId,
              quantity: 2,
            },
          ],
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.status).toBe('PENDING');
      expect(response.body.totalAmount).toBe(200);
      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0].quantity).toBe(2);
      expect(response.body.items[0].unitPrice).toBe(100);
    });

    it('should reject order for invisible business', async () => {
      await prisma.product.update({
        where: { id: productId },
        data: { isActive: false },
      });

      await prisma.business.update({
        where: { id: businessId },
        data: { isVisible: false },
      });

      await request(app.getHttpServer())
        .post('/orders')
        .send({
          businessId,
          customerName: 'John Doe',
          customerPhone: '1234567890',
          items: [
            {
              productId,
              quantity: 1,
            },
          ],
        })
        .expect(400);
    });

    it('should reject order with inactive product', async () => {
      await request(app.getHttpServer())
        .patch(`/products/${productId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          isActive: false,
        });

      await request(app.getHttpServer())
        .post('/orders')
        .send({
          businessId,
          customerName: 'John Doe',
          customerPhone: '1234567890',
          items: [
            {
              productId,
              quantity: 1,
            },
          ],
        })
        .expect(400);
    });

    it('should calculate total correctly for multiple items', async () => {
      const product2Response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          businessId,
          name: 'Product 2',
          price: 50,
        });

      const response = await request(app.getHttpServer())
        .post('/orders')
        .send({
          businessId,
          customerName: 'Jane Doe',
          customerPhone: '0987654321',
          items: [
            {
              productId,
              quantity: 2,
            },
            {
              productId: product2Response.body.id,
              quantity: 3,
            },
          ],
        })
        .expect(201);

      expect(response.body.totalAmount).toBe(350);
      expect(response.body.items).toHaveLength(2);
    });
  });

  describe('/orders/my-business (GET)', () => {
    it('should get orders for business owner', async () => {
      await request(app.getHttpServer())
        .post('/orders')
        .send({
          businessId,
          customerName: 'Customer 1',
          customerPhone: '1111111111',
          items: [{ productId, quantity: 1 }],
        });

      await request(app.getHttpServer())
        .post('/orders')
        .send({
          businessId,
          customerName: 'Customer 2',
          customerPhone: '2222222222',
          items: [{ productId, quantity: 2 }],
        });

      const response = await request(app.getHttpServer())
        .get('/orders/my-business')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('items');
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/orders/my-business')
        .expect(401);
    });
  });

  describe('/orders/:id/status (PATCH)', () => {
    it('should update order status', async () => {
      const orderResponse = await request(app.getHttpServer())
        .post('/orders')
        .send({
          businessId,
          customerName: 'Customer',
          customerPhone: '1234567890',
          items: [{ productId, quantity: 1 }],
        });

      const orderId = orderResponse.body.id;

      const response = await request(app.getHttpServer())
        .patch(`/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          status: OrderStatus.CONFIRMED,
        })
        .expect(200);

      expect(response.body.status).toBe('CONFIRMED');
    });

    it('should reject unauthorized status update', async () => {
      const orderResponse = await request(app.getHttpServer())
        .post('/orders')
        .send({
          businessId,
          customerName: 'Customer',
          customerPhone: '1234567890',
          items: [{ productId, quantity: 1 }],
        });

      const orderId = orderResponse.body.id;

      const otherUserResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'other-order@example.com',
          password: 'password123',
          fullName: 'Other User',
          phone: '0987654321',
        });

      await prisma.user.update({
        where: { email: 'other-order@example.com' },
        data: { isVerified: true, role: 'SELLER' },
      });

      const otherLoginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'other-order@example.com',
          password: 'password123',
        });

      await request(app.getHttpServer())
        .patch(`/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${otherLoginResponse.body.access_token}`)
        .send({
          status: OrderStatus.CONFIRMED,
        })
        .expect(403);
    });
  });
});
