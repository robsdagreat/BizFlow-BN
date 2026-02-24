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
exports.BusinessesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const qr_service_1 = require("./qr.service");
let BusinessesService = class BusinessesService {
    prisma;
    qrService;
    constructor(prisma, qrService) {
        this.prisma = prisma;
        this.qrService = qrService;
    }
    async generateUniqueSlug(name) {
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
    async create(ownerId, dto) {
        const user = await this.prisma.user.findUnique({
            where: { id: ownerId },
        });
        if (!user?.isVerified) {
            throw new common_1.ConflictException('Please verify your email before creating a business.');
        }
        const existingBusiness = await this.prisma.business.findFirst({
            where: { ownerId },
        });
        if (existingBusiness) {
            throw new common_1.ConflictException('You already have a business. Only one business per seller is allowed.');
        }
        const slug = await this.generateUniqueSlug(dto.name);
        const frontendUrl = process.env.FRONTEND_URL || 'https://biziflow.com';
        const publicUrl = `${frontendUrl}/order/${slug}`;
        const business = await this.prisma.business.create({
            data: {
                ...dto,
                ownerId,
                slug,
                publicUrl,
                isVisible: false,
                isVerified: false,
            },
        });
        const qrCode = await this.qrService.generateQRCode(publicUrl);
        const updatedBusiness = await this.prisma.business.update({
            where: { id: business.id },
            data: { qrCode },
        });
        return updatedBusiness;
    }
    async myBusiness(ownerId) {
        return this.prisma.business.findFirst({
            where: { ownerId },
            include: {
                products: true,
            },
        });
    }
    async update(ownerId, businessId, dto) {
        const business = await this.prisma.business.findUnique({
            where: { id: businessId },
        });
        if (!business) {
            throw new common_1.NotFoundException('Business not found');
        }
        if (business.ownerId !== ownerId) {
            throw new common_1.ForbiddenException('You do not own this business');
        }
        const updatedBusiness = await this.prisma.business.update({
            where: { id: businessId },
            data: dto,
        });
        await this.checkAndActivateBusiness(businessId);
        return updatedBusiness;
    }
    async findOne(id) {
        return this.prisma.business.findUnique({
            where: { id },
            include: { products: true },
        });
    }
    async findBySlug(slug) {
        const business = await this.prisma.business.findUnique({
            where: { slug },
            include: { products: true },
        });
        if (!business) {
            throw new common_1.NotFoundException('Business not found');
        }
        return business;
    }
    async checkAndActivateBusiness(businessId) {
        const business = await this.prisma.business.findUnique({
            where: { id: businessId },
            include: { products: true },
        });
        if (!business)
            return;
        const hasActiveProduct = business.products.some((p) => p.isActive);
        const shouldBeVisible = hasActiveProduct;
        if (business.isVisible !== shouldBeVisible) {
            await this.prisma.business.update({
                where: { id: businessId },
                data: { isVisible: shouldBeVisible },
            });
            console.log(`Business ${business.id} visibility set to ${shouldBeVisible}`);
        }
    }
};
exports.BusinessesService = BusinessesService;
exports.BusinessesService = BusinessesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        qr_service_1.QrService])
], BusinessesService);
//# sourceMappingURL=businesses.service.js.map