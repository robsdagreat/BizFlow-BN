import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Discovery (e2e)', () => {
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

  describe('/discovery (GET)', () => {
    it('should return only visible businesses', async () => {
      const user1Response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'seller1@example.com',
          password: 'password123',
          fullName: 'Seller 1',
          phone: '1234567891',
        })
        .expect(201);

      await prisma.user.update({
        where: { email: 'seller1@example.com' },
        data: { isVerified: true, role: 'SELLER' },
      });

      const login1Response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'seller1@example.com',
          password: 'password123',
        });

      const business1Response = await request(app.getHttpServer())
        .post('/businesses')
        .set('Authorization', `Bearer ${login1Response.body.access_token}`)
        .send({
          name: 'Visible Business',
          description: 'Has products',
          category: 'Tech',
          city: 'NYC',
        });

      await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${login1Response.body.access_token}`)
        .send({
          businessId: business1Response.body.id,
          name: 'Product 1',
          price: 50,
        });

      const user2Response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'seller2@example.com',
          password: 'password123',
          fullName: 'Seller 2',
          phone: '1234567892',
        })
        .expect(201);

      await prisma.user.update({
        where: { email: 'seller2@example.com' },
        data: { isVerified: true, role: 'SELLER' },
      });

      const login2Response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'seller2@example.com',
          password: 'password123',
        });

      await request(app.getHttpServer())
        .post('/businesses')
        .set('Authorization', `Bearer ${login2Response.body.access_token}`)
        .send({
          name: 'Invisible Business',
          description: 'No products',
          category: 'Tech',
          city: 'LA',
        });

      const response = await request(app.getHttpServer())
        .get('/discovery')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe('Visible Business');
    });

    it('should filter by city', async () => {
      const userResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'seller@example.com',
          password: 'password123',
          fullName: 'Seller',
          phone: '1234567893',
        })
        .expect(201);

      await prisma.user.update({
        where: { email: 'seller@example.com' },
        data: { isVerified: true, role: 'SELLER' },
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'seller@example.com',
          password: 'password123',
        });

      const token = loginResponse.body.access_token;

      const businessResponse = await request(app.getHttpServer())
        .post('/businesses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'NYC Business',
          description: 'In NYC',
          category: 'Tech',
          city: 'New York',
        });

      await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send({
          businessId: businessResponse.body.id,
          name: 'Product',
          price: 50,
        });

      const response = await request(app.getHttpServer())
        .get('/discovery?city=New York')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].city).toBe('New York');

      const emptyResponse = await request(app.getHttpServer())
        .get('/discovery?city=Los Angeles')
        .expect(200);

      expect(emptyResponse.body).toHaveLength(0);
    });

    it('should filter by category', async () => {
      const userResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'seller@example.com',
          password: 'password123',
          fullName: 'Seller',
          phone: '1234567894',
        })
        .expect(201);

      await prisma.user.update({
        where: { email: 'seller@example.com' },
        data: { isVerified: true, role: 'SELLER' },
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'seller@example.com',
          password: 'password123',
        });

      const token = loginResponse.body.access_token;

      const businessResponse = await request(app.getHttpServer())
        .post('/businesses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Tech Business',
          description: 'Tech',
          category: 'Technology',
          city: 'NYC',
        });

      await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send({
          businessId: businessResponse.body.id,
          name: 'Product',
          price: 50,
        });

      const response = await request(app.getHttpServer())
        .get('/discovery?category=Technology')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].category).toBe('Technology');
    });
  });
});
