import { PrismaService } from '../prisma/prisma.service';
export declare class DiscoveryService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(city?: string, category?: string): Promise<({
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
    })[]>;
}
