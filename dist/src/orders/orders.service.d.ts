import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
export declare class OrdersService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateOrderDto): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.OrderStatus;
        totalAmount: number;
        items: {
            id: string;
            productId: string;
            quantity: number;
            productName: string;
            unitPrice: number;
            subtotal: number;
            orderId: string;
        }[];
        createdAt: Date;
    }>;
    findForBusiness(userId: string): Promise<({
        items: {
            id: string;
            productId: string;
            quantity: number;
            productName: string;
            unitPrice: number;
            subtotal: number;
            orderId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        businessId: string;
        customerName: string;
        customerPhone: string;
        status: import("@prisma/client").$Enums.OrderStatus;
        totalAmount: number;
        customerId: string | null;
    })[]>;
    updateStatus(id: string, dto: UpdateOrderStatusDto, userId: string): Promise<{
        items: {
            id: string;
            productId: string;
            quantity: number;
            productName: string;
            unitPrice: number;
            subtotal: number;
            orderId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        businessId: string;
        customerName: string;
        customerPhone: string;
        status: import("@prisma/client").$Enums.OrderStatus;
        totalAmount: number;
        customerId: string | null;
    }>;
}
