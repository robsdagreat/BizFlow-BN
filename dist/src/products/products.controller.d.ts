import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    create(req: any, createProductDto: CreateProductDto): Promise<{
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
    myProducts(req: any): Promise<{
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
    update(req: any, id: string, updateProductDto: UpdateProductDto): Promise<{
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
    remove(req: any, id: string): Promise<void>;
}
