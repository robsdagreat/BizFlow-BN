import { BusinessesService } from './businesses.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
export declare class BusinessesController {
    private readonly businessesService;
    constructor(businessesService: BusinessesService);
    create(req: any, createBusinessDto: CreateBusinessDto): Promise<{
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
    myBusiness(req: any): Promise<({
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
    update(req: any, id: string, updateBusinessDto: UpdateBusinessDto): Promise<{
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
}
