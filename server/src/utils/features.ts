import NodeCache from "node-cache";
import { Product } from "../models/product.model.js";
import { InvalidateCacheProps } from "../types/types.js";
import { nodeCache } from "../app.js";


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