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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const businesses_service_1 = require("../businesses/businesses.service");
let ProductsService = class ProductsService {
    prisma;
    businessesService;
    constructor(prisma, businessesService) {
        this.prisma = prisma;
        this.businessesService = businessesService;
    }
    async create(ownerId, dto) {
        const business = await this.prisma.business.findUnique({
            where: { id: dto.businessId },
        });
        if (!business) {
            throw new common_1.NotFoundException('Business not found');
        }
        if (business.ownerId !== ownerId) {
            throw new common_1.ForbiddenException('You do not own this business');
        }
        const product = await this.prisma.product.create({
            data: dto,
        });
        await this.businessesService.checkAndActivateBusiness(business.id);
        return product;
    }
    async myProducts(ownerId) {
        const business = await this.businessesService.myBusiness(ownerId);
        if (!business)
            return [];
        return this.prisma.product.findMany({
            where: { businessId: business.id },
        });
    }
    async findOne(id) {
        return this.prisma.product.findUnique({
            where: { id },
        });
    }
    async update(ownerId, productId, dto) {
        const product = await this.findOne(productId);
        if (!product)
            throw new common_1.NotFoundException('Product not found');
        const business = await this.prisma.business.findUnique({
            where: { id: product.businessId },
        });
        if (!business || business.ownerId !== ownerId) {
            throw new common_1.ForbiddenException('You do not own this product');
        }
        const updatedProduct = await this.prisma.product.update({
            where: { id: productId },
            data: dto,
        });
        await this.businessesService.checkAndActivateBusiness(business.id);
        return updatedProduct;
    }
    async remove(ownerId, productId) {
        const product = await this.findOne(productId);
        if (!product)
            throw new common_1.NotFoundException('Product not found');
        const business = await this.prisma.business.findUnique({
            where: { id: product.businessId },
        });
        if (!business || business.ownerId !== ownerId) {
            throw new common_1.ForbiddenException('You do not own this product');
        }
        await this.prisma.product.delete({
            where: { id: productId },
        });
        await this.businessesService.checkAndActivateBusiness(business.id);
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        businesses_service_1.BusinessesService])
], ProductsService);
//# sourceMappingURL=products.service.js.map