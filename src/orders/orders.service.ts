import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus, Prisma } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateOrderDto) {
    const { businessId, items, customerName, customerPhone } = dto;

    // 1. Fetch Business
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    if (!business.isVisible) {
      throw new BadRequestException(
        'This business is currently not accepting orders',
      );
    }

    // 2. Fetch Products to Validate & Snapshot Price
    const productIds = items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        businessId: businessId, // Ensure products belong to this business
      },
    });

    if (products.length !== productIds.length) {
      // Some products were not found or don't belong to the business
      throw new BadRequestException(
        'One or more products are invalid or do not belong to this business',
      );
    }

    // 3. Prepare Order Items & Calculate Totals
    let totalAmount = 0;
    const orderItemsData: Prisma.OrderItemUncheckedCreateWithoutOrderInput[] =
      [];

    for (const itemDto of items) {
      const product = products.find((p) => p.id === itemDto.productId);

      if (!product) {
        // Should not happen due to earlier check, but satisfies TS
        throw new BadRequestException(
          `Product with ID ${itemDto.productId} not found`,
        );
      }

      if (!product.isActive) {
        throw new BadRequestException(
          `Product "${product.name}" is currently unavailable`,
        );
      }

      const subtotal = product.price * itemDto.quantity;
      totalAmount += subtotal;

      orderItemsData.push({
        productId: product.id,
        productName: product.name, // Snapshot name
        unitPrice: product.price, // Snapshot price
        quantity: itemDto.quantity,
        subtotal: subtotal,
      });
    }

    // 4. Transactional Create
    const order = await this.prisma.$transaction(async (prisma) => {
      const newOrder = await prisma.order.create({
        data: {
          businessId,
          customerName,
          customerPhone,
          totalAmount,
          status: OrderStatus.PENDING,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: true,
        },
      });

      return newOrder;
    });

    // 5. Response Clean up
    return {
      id: order.id,
      status: order.status,
      totalAmount: order.totalAmount,
      items: order.items,
      createdAt: order.createdAt,
    };
  }

  async findForBusiness(userId: string) {
    // 1. Find Business Owned by User
    const business = await this.prisma.business.findFirst({
      where: { ownerId: userId },
    });

    if (!business) {
      throw new NotFoundException('You do not have a business registered');
    }

    // 2. Fetch Orders
    return this.prisma.order.findMany({
      where: { businessId: business.id },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto, userId: string) {
    // 1. Find Order & Verify Ownership
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { business: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.business.ownerId !== userId) {
      throw new ForbiddenException(
        'You are not authorized to manage this order',
      );
    }

    // 2. Update Status
    return this.prisma.order.update({
      where: { id },
      data: { status: dto.status },
      include: { items: true }, // Return updated order with items
    });
  }
}
