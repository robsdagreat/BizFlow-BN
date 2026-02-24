import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class DiscoveryService {
  constructor(private prisma: PrismaService) {}

  async findAll(city?: string, category?: string) {
    const where: Prisma.BusinessWhereInput = {
      isVisible: true,
    };

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (category) {
      where.category = { contains: category, mode: 'insensitive' };
    }

    return this.prisma.business.findMany({
      where,
      include: {
        products: {
          where: { isActive: true },
        },
      },
    });
  }
}
