import { PrismaService } from '../prisma/prisma.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { QrService } from './qr.service';
export declare class BusinessesService {
    private prisma;
    private qrService;
    constructor(prisma: PrismaService, qrService: QrService);
    private generateUniqueSlug;
    create(ownerId: string, dto: CreateBusinessDto): Promise<{
        id: string;
        isVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string;
        category: string;
        logoUrl: string | null;
        coverImageUrl: string | null;
        city: string;
        address: string | null;
        slug: string;
        publicUrl: string;
        qrCode: string | null;
        isVisible: boolean;
        ownerId: string;
    }>;
    myBusiness(ownerId: string): Promise<({
        products: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            price: number;
            imageUrl: string | null;
            isActive: boolean;
            businessId: string;
        }[];
    } & {
        id: string;
        isVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string;
        category: string;
        logoUrl: string | null;
        coverImageUrl: string | null;
        city: string;
        address: string | null;
        slug: string;
        publicUrl: string;
        qrCode: string | null;
        isVisible: boolean;
        ownerId: string;
    }) | null>;
    update(ownerId: string, businessId: string, dto: UpdateBusinessDto): Promise<{
        id: string;
        isVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string;
        category: string;
        logoUrl: string | null;
        coverImageUrl: string | null;
        city: string;
        address: string | null;
        slug: string;
        publicUrl: string;
        qrCode: string | null;
        isVisible: boolean;
        ownerId: string;
    }>;
    findOne(id: string): Promise<({
        products: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            price: number;
            imageUrl: string | null;
            isActive: boolean;
            businessId: string;
        }[];
    } & {
        id: string;
        isVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string;
        category: string;
        logoUrl: string | null;
        coverImageUrl: string | null;
        city: string;
        address: string | null;
        slug: string;
        publicUrl: string;
        qrCode: string | null;
        isVisible: boolean;
        ownerId: string;
    }) | null>;
    findBySlug(slug: string): Promise<{
        products: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            price: number;
            imageUrl: string | null;
            isActive: boolean;
            businessId: string;
        }[];
    } & {
        id: string;
        isVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string;
        category: string;
        logoUrl: string | null;
        coverImageUrl: string | null;
        city: string;
        address: string | null;
        slug: string;
        publicUrl: string;
        qrCode: string | null;
        isVisible: boolean;
        ownerId: string;
    }>;
    checkAndActivateBusiness(businessId: string): Promise<void>;
}
