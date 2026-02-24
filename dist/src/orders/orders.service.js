"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let OrdersService = class OrdersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        const { businessId, items, customerName, customerPhone } = dto;
        const business = await this.prisma.business.findUnique({
            where: { id: businessId },
        });
        if (!business) {
            throw new common_1.NotFoundException('Business not found');
        }
        if (!business.isVisible) {
            throw new common_1.BadRequestException('This business is currently not accepting orders');
        }
        const productIds = items.map((i) => i.productId);
        const products = await this.prisma.product.findMany({
            where: {
                id: { in: productIds },
                businessId: businessId,
            },
        });
        if (products.length !== productIds.length) {
            throw new common_1.BadRequestException('One or more products are invalid or do not belong to this business');
        }
        let totalAmount = 0;
        const orderItemsData = [];
        for (const itemDto of items) {
            const product = products.find((p) => p.id === itemDto.productId);
            if (!product) {
                throw new common_1.BadRequestException(`Product with ID ${itemDto.productId} not found`);
            }
            if (!product.isActive) {
                throw new common_1.BadRequestException(`Product "${product.name}" is currently unavailable`);
            }
            const subtotal = product.price * itemDto.quantity;
            totalAmount += subtotal;
            orderItemsData.push({
                productId: product.id,
                productName: product.name,
                unitPrice: product.price,
                quantity: itemDto.quantity,
                subtotal: subtotal,
            });
        }
        const order = await this.prisma.$transaction(async (prisma) => {
            const newOrder = await prisma.order.create({
                data: {
                    businessId,
                    customerName,
                    customerPhone,
                    totalAmount,
                    status: client_1.OrderStatus.PENDING,
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
        return {
            id: order.id,
            status: order.status,
            totalAmount: order.totalAmount,
            items: order.items,
            createdAt: order.createdAt,
        };
    }
    async findForBusiness(userId) {
        const business = await this.prisma.business.findFirst({
            where: { ownerId: userId },
        });
        if (!business) {
            throw new common_1.NotFoundException('You do not have a business registered');
        }
        return this.prisma.order.findMany({
            where: { businessId: business.id },
            include: { items: true },
            orderBy: { createdAt: 'desc' },
        });
    }
    async updateStatus(id, dto, userId) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: { business: true },
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        if (order.business.ownerId !== userId) {
            throw new common_1.ForbiddenException('You are not authorized to manage this order');
        }
        return this.prisma.order.update({
            where: { id },
            data: { status: dto.status },
            include: { items: true },
        });
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map