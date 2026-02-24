import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    create(createOrderDto: CreateOrderDto): Promise<{
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
    findMyBusinessOrders(req: any): Promise<({
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
    updateStatus(id: string, updateOrderStatusDto: UpdateOrderStatusDto, req: any): Promise<{
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
