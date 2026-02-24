import { PrismaService } from '../prisma/prisma.service';
import { BusinessesService } from '../businesses/businesses.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
export declare class ProductsService {
    private prisma;
    private businessesService;
    constructor(prisma: PrismaService, businessesService: BusinessesService);
    create(ownerId: string, dto: CreateProductDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        price: number;
        imageUrl: string | null;
        isActive: boolean;
        businessId: string;
    }>;
    myProducts(ownerId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        price: number;
        imageUrl: string | null;
        isActive: boolean;
        businessId: string;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        price: number;
        imageUrl: string | null;
        isActive: boolean;
        businessId: string;
    } | null>;
    update(ownerId: string, productId: string, dto: UpdateProductDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        price: number;
        imageUrl: string | null;
        isActive: boolean;
        businessId: string;
    }>;
    remove(ownerId: string, productId: string): Promise<void>;
}
