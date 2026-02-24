declare class OrderItemDto {
    productId: string;
    quantity: number;
}
export declare class CreateOrderDto {
    businessId: string;
    customerName: string;
    customerPhone: string;
    items: OrderItemDto[];
}
export {};
