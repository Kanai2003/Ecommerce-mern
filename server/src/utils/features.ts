import mongoose, { Document, Model } from "mongoose";
import { nodeCache } from "../app.js";
import { Product, ProductDocument } from "../models/product.model.js";
import { InvalidateCacheProps, OrderItemType } from "../types/types.js";



export const invalidateCache = ({
  product,
  order,
  admin,
  userId,
  orderId,
  productId,
}: InvalidateCacheProps): void => {
  if (product) {
    const productKeys: string[] = [
      "latest-products",
      "categories",
      "all-products",
    ];

    if (typeof productId === "string") productKeys.push(`product-${productId}`);

    if (Array.isArray(productId))
      productId.forEach((i) => productKeys.push(`product-${i}`));

    nodeCache.del(productKeys);
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
};

export const reduceStock = async (orderItems: OrderItemType[]): Promise<void> => {
  for (let i = 0; i < orderItems.length; i++) {
    const order = orderItems[i];
    const product: ProductDocument | null = await Product.findById(order.productId);
    if (!product) throw new Error("Product Not Found");
    product.stock -= order.quantity;
    await product.save();
  }
};

export const calculatePercentage = (thisMonth: number, lastMonth: number): number => {
  if (lastMonth === 0) return thisMonth * 100;
  const percent: number = (thisMonth / lastMonth) * 100;
  return Number(percent.toFixed(0));
};

export const getInventories = async ({
  categories,
  productsCount,
}: {
  categories: string[];
  productsCount: number;
}): Promise<Array<Record<string, number>>> => {
  const categoriesCountPromise: Promise<number>[] = categories.map((category) =>
    Product.countDocuments({ category })
  );

  const categoriesCount: number[] = await Promise.all(categoriesCountPromise);

  const categoryCount: Array<Record<string, number>> = [];

  categories.forEach((category, i) => {
    categoryCount.push({
      [category]: Math.round((categoriesCount[i] / productsCount) * 100),
    });
  });

  return categoryCount;
};

interface MyDocument extends Document {
  createdAt: Date;
  discount?: number;
  total?: number;
}
type FuncProps = {
  length: number;
  docArr: MyDocument[];
  today: Date;
  property?: "discount" | "total";
};

export const getChartData = ({
  length,
  docArr,
  today,
  property,
}: FuncProps): number[] => {
  const data: number[] = new Array(length).fill(0);

  docArr.forEach((i) => {
    const creationDate = i.createdAt;
    const monthDiff: number = (today.getMonth() - creationDate.getMonth() + 12) % 12;

    if (monthDiff < length) {
      if (property) {
        data[length - monthDiff - 1] += i[property] || 0;
      } else {
        data[length - monthDiff - 1]++;
      }
    }
  });

  return data;
};
