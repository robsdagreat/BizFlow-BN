import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessesService } from '../businesses/businesses.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private businessesService: BusinessesService,
  ) {}

  async create(ownerId: string, dto: CreateProductDto) {
    // 1. Verify business ownership
    const business = await this.prisma.business.findUnique({
      where: { id: dto.businessId },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    if (business.ownerId !== ownerId) {
      throw new ForbiddenException('You do not own this business');
    }

    // 2. Create product
    const product = await this.prisma.product.create({
      data: dto,
    });

    // 3. Trigger activation logic
    await this.businessesService.checkAndActivateBusiness(business.id);

    return product;
  }

  async myProducts(ownerId: string) {
    // Find business first (since we assume 1 business per seller)
    const business = await this.businessesService.myBusiness(ownerId);
    if (!business) return [];

    return this.prisma.product.findMany({
      where: { businessId: business.id },
    });
  }

  async findOne(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
    });
  }

  async update(ownerId: string, productId: string, dto: UpdateProductDto) {
    const product = await this.findOne(productId);
    if (!product) throw new NotFoundException('Product not found');

    // Check ownership via business
    const business = await this.prisma.business.findUnique({
      where: { id: product.businessId },
    });

    if (!business || business.ownerId !== ownerId) {
      throw new ForbiddenException('You do not own this product');
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id: productId },
      data: dto,
    });

    // Trigger activation logic (e.g. if isActive changed)
    await this.businessesService.checkAndActivateBusiness(business.id);

    return updatedProduct;
  }

  async remove(ownerId: string, productId: string) {
    const product = await this.findOne(productId);
    if (!product) throw new NotFoundException('Product not found');

    const business = await this.prisma.business.findUnique({
      where: { id: product.businessId },
    });

    if (!business || business.ownerId !== ownerId) {
      throw new ForbiddenException('You do not own this product');
    }

    await this.prisma.product.delete({
      where: { id: productId },
    });

    // Re-check activation status (might need to hide business if no active products left)
    await this.businessesService.checkAndActivateBusiness(business.id);
  }
}
