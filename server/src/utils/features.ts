import NodeCache from "node-cache";
import { Product } from "../models/product.model.js";
import { InvalidateCacheProps, OrderItemType } from "../types/types.js";
import { nodeCache } from "../app.js";
import { ApiError } from "./ApiError.js";


export const invalidateCache = ({
    product,
    order,
    admin,
    userId,
    orderId,
    productId
}: InvalidateCacheProps) => {
    if (product) {
        const productKeys: string[] = [
            "latest-products",
            "categories",
            "all-products",
        ];

        if (typeof productId === "string") {
            productKeys.push(`product-${productId}`)
        }

        if (typeof productId === "object") {
            productId.forEach((i) => productKeys.push(`product-${i}`))
        }

        nodeCache.del(productKeys)
    }

    if (order) {
        const ordersKeys: string[] = [
            "all-orders",
            `my-orders-${userId}`,
            `order-${orderId}`,
        ];

        nodeCache.del(ordersKeys);
    }
    if (admin) {
        nodeCache.del([
            "admin-stats",
            "admin-pie-charts",
            "admin-bar-charts",
            "admin-line-charts",
        ]);
    }
}


export const reduceStock = async (orderItems: OrderItemType[])=> {
    for(let i=0; i<orderItems.length; i++){
        const order = orderItems[i]
        const product = await Product.findById(order.productId)
        if(!product){
            throw new ApiError(404, "Product not found!")
        }
        product.stock -= order.quantity
        await product.save()
    }
}