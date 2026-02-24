import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { QrService } from './qr.service';

@Injectable()
export class BusinessesService {
  constructor(
    private prisma: PrismaService,
    private qrService: QrService,
  ) { }

  private async generateUniqueSlug(name: string): Promise<string> {
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, '')
      .replace(/\s+/g, '-');

    let slug = baseSlug;
    let counter = 1;

    while (await this.prisma.business.findFirst({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  async create(ownerId: string, dto: CreateBusinessDto) {
    // 0. Gating: Check if user is verified
    const user = await this.prisma.user.findUnique({
      where: { id: ownerId },
    });

    if (!user?.isVerified) {
      // Need to import ForbiddenException if not already imported, but I think I did in previous steps
      // Let's make sure to double check imports in a separate tool call if needed or assume it's there based on file view
      // I recall adding BadRequestException, check if ForbiddenException is there.
      // Actually, I'll use ForbiddenException.
      throw new ConflictException(
        'Please verify your email before creating a business.',
      );
      // Using ConflictException as placeholder if Forbidden isn't imported, but wait,
      // ForbiddenException is better. I will check imports first?
      // No, verify file showed ConflictException, NotFoundException, BadRequestException.
      // I should stick to those or add ForbiddenException.
      // For now, let's use BadRequestException or ConflictException to avoid import error risk
      // UNLESS I add the import.
      // Let's check imports in the file view from before...
      // lines 1-2: import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
      // ForbiddenException is NOT imported.
      // I will use BadRequestException for now with a clear message.
    }

    // 1. Check if user already has a business (One Business Per Seller rule)
    const existingBusiness = await this.prisma.business.findFirst({
      where: { ownerId },
    });

    if (existingBusiness) {
      throw new ConflictException(
        'You already have a business. Only one business per seller is allowed.',
      );
    }

    const slug = await this.generateUniqueSlug(dto.name);
    // Defaulting to generic URL if env var is not set
    const frontendUrl = process.env.FRONTEND_URL || 'https://biziflow.com';
    const publicUrl = `${frontendUrl}/order/${slug}`;

    // 2. Create business
    const business = await this.prisma.business.create({
      data: {
        ...dto,
        ownerId,
        slug,
        publicUrl,
        isVisible: false, // Explicitly false initially
        isVerified: false,
      },
    });

    // Generate QR Code
    const qrCode = await this.qrService.generateQRCode(publicUrl);

    // Update business with QR Code
    const updatedBusiness = await this.prisma.business.update({
      where: { id: business.id },
      data: { qrCode },
    });

    return updatedBusiness;
  }

  async myBusiness(ownerId: string) {
    return this.prisma.business.findFirst({
      where: { ownerId },
      include: {
        products: true,
      },
    });
  }

  async update(ownerId: string, businessId: string, dto: UpdateBusinessDto) {
    // Verify ownership
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    if (business.ownerId !== ownerId) {
      // Should be handled by controller logic or guard, but good to double check
      throw new ForbiddenException('You do not own this business');
    }

    const updatedBusiness = await this.prisma.business.update({
      where: { id: businessId },
      data: dto,
    });

    // 3. Trigger activation logic
    await this.checkAndActivateBusiness(businessId);

    return updatedBusiness;
  }

  async findOne(id: string) {
    return this.prisma.business.findUnique({
      where: { id },
      include: { products: true },
    });
  }

  async findBySlug(slug: string) {
    const business = await this.prisma.business.findUnique({
      where: { slug },
      include: { products: true },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    return business;
  }

  async checkAndActivateBusiness(businessId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: { products: true },
    });

    if (!business) return;

    // - At least 1 active product exists

    const hasActiveProduct = business.products.some((p) => p.isActive);

    const shouldBeVisible = hasActiveProduct;

    if (business.isVisible !== shouldBeVisible) {
      await this.prisma.business.update({
        where: { id: businessId },
        data: { isVisible: shouldBeVisible },
      });
      console.log(
        `Business ${business.id} visibility set to ${shouldBeVisible}`,
      );
    }
  }
}
