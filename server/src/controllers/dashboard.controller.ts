import { Request, Response } from "express";
import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { Product } from "../models/product.model.js";
import { Order } from "../models/order.model.js";
import { nodeCache } from "../app.js";
import { calculatePercentage, getChartData, getInventories } from "../utils/features.js";

export const dashboardStats = asyncHandler(async (req: Request, res: Response) => {
    let stats: any = {};
    const key = "admin-stats";

    try {
        if (nodeCache.has(key)) {
            stats = JSON.parse(nodeCache.get(key) as string);
        } else {
            const today = new Date();
            const sixMonthAgo = new Date(today.getFullYear(), today.getMonth() - 6, 1);
            const thisMonth = {
                start: new Date(today.getFullYear(), today.getMonth(), 1),
                end: today
            };
            const lastMonth = {
                start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
                end: new Date(today.getFullYear(), today.getMonth(), 0)
            };

            const [
                thisMonthProducts,
                thisMonthUser,
                thisMonthOrder,
                lastMonthProducts,
                lastMonthUser,
                lastMonthOrder,
                productsCount,
                usersCount,
                allOrders,
                lastSixMonthOrder,
                categories,
                femaleUserCount,
                latestTransactions
            ] = await Promise.all([
                Product.find({
                    createdAt: { $gte: thisMonth.start, $lte: thisMonth.end }
                }),
                User.find({
                    createdAt: { $gte: thisMonth.start, $lte: thisMonth.end }
                }),
                Order.find({
                    createdAt: { $gte: thisMonth.start, $lte: thisMonth.end }
                }),
                Product.find({
                    createdAt: { $gte: lastMonth.start, $lte: lastMonth.end }
                }),
                User.find({
                    createdAt: { $gte: lastMonth.start, $lte: lastMonth.end }
                }),
                Order.find({
                    createdAt: { $gte: lastMonth.start, $lte: lastMonth.end }
                }),
                Product.countDocuments(),
                User.countDocuments(),
                Order.find({}).select("total"),
                Order.find({
                    createdAt: { $gte: sixMonthAgo, $lte: today }
                }),
                Product.distinct("category"),
                User.countDocuments({ gender: "female" }),
                Order.find({}).select(["orderItems", "discount", "total", "status"]).limit(4)
            ]);

            const thisMonthRevenue = thisMonthOrder.reduce(
                (total, order) => total + (order.total || 0),
                0
            );

            const lastMonthRevenue = lastMonthOrder.reduce(
                (total, order) => total + (order.total || 0),
                0
            );

            const changePercent = {
                revenue: calculatePercentage(thisMonthRevenue, lastMonthRevenue),
                product: calculatePercentage(thisMonthProducts.length, lastMonthProducts.length),
                user: calculatePercentage(thisMonthUser.length, lastMonthUser.length),
                order: calculatePercentage(thisMonthOrder.length, lastMonthOrder.length)
            };

            const revenue = allOrders.reduce(
                (total, order) => total + (order.total || 0),
                0
            );

            const orderMonthCount = new Array(6).fill(0);
            const orderMonthRevenue = new Array(6).fill(0);

            lastSixMonthOrder.forEach((order) => {
                const creationDate = order.createdAt;
                const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;

                if (monthDiff < 6) {
                    orderMonthCount[6 - monthDiff - 1] += 1;
                    orderMonthRevenue[6 - monthDiff - 1] += order.total;
                }
            });

            const categoriesCount = await getInventories({
                categories,
                productsCount
            });

            const userRatio = {
                male: usersCount - femaleUserCount,
                female: femaleUserCount
            };

            const modifiedLatestTransaction = latestTransactions.map((i) => ({
                _id: i._id,
                discount: i.discount,
                amount: i.total,
                quantity: i.orderItems.length,
                status: i.status
            }));

            stats = {
                categoriesCount,
                changePercent,
                count: {
                    revenue,
                    product: productsCount,
                    user: usersCount,
                    order: allOrders.length
                },
                chart: {
                    order: orderMonthCount,
                    revenue: orderMonthRevenue
                },
                userRatio,
                latestTransactions: modifiedLatestTransaction
            };

            nodeCache.set(key, JSON.stringify(stats));
        }

        return res.status(200).json({
            success: true,
            stats
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            error: "Internal Server Error"
        });
    }
});

export const pieCharts = asyncHandler(async (req: Request, res: Response) => {
    let charts: any;
    const key = "admin-pie-charts";

    try {
        if (nodeCache.has(key)) {
            charts = JSON.parse(nodeCache.get(key) as string);
        } else {
            const allOrderPromise = Order.find({}).select([
                "total",
                "discount",
                "subtotal",
                "tax",
                "shippingCharges",
            ]);

            const [
                processingOrder,
                shippedOrder,
                deliveredOrder,
                categories,
                productsCount,
                outOfStock,
                allOrders,
                allUsers,
                adminUsers,
                customerUsers
            ] = await Promise.all([
                Order.countDocuments({ status: "Processing" }),
                Order.countDocuments({ status: "Shipped" }),
                Order.countDocuments({ status: "Delivered" }),
                Product.distinct("category"),
                Product.countDocuments(),
                Product.countDocuments({ stock: 0 }),
                allOrderPromise,
                User.find({}).select(["dob"]),
                User.countDocuments({ role: "admin" }),
                User.countDocuments({ role: "user" })
            ]);

            const orderFullfillment = {
                processing: processingOrder,
                shipped: shippedOrder,
                delivered: deliveredOrder,
            };

            const productCategories = await getInventories({
                categories,
                productsCount,
            });

            const stockAvailablity = {
                inStock: productsCount - outOfStock,
                outOfStock,
            };

            const grossIncome = allOrders.reduce(
                (prev, order) => prev + (order.total || 0),
                0
            );

            const discount = allOrders.reduce(
                (prev, order) => prev + (order.discount || 0),
                0
            );

            const shippingCost = allOrders.reduce(
                (prev, order) => prev + (order.shippingCharges || 0),
                0
            );

            const burnt = allOrders.reduce((prev, order) => prev + (order.tax || 0), 0);

            const marketingCost = Math.round(grossIncome * (30 / 100));

            const netMargin = grossIncome - discount - shippingCost - burnt - marketingCost;

            const revenueDistribution = {
                netMargin,
                discount,
                shippingCost,
                burnt,
                marketingCost,
            };

            const usersAgeGroup = {
                teen: allUsers.filter((i: any) => i.age < 20).length,
                adult: allUsers.filter((i: any) => i.age >= 20 && i.age < 40).length,
                old: allUsers.filter((i: any) => i.age >= 40).length,
            };

            const adminCustomer = {
                admin: adminUsers,
                customer: customerUsers,
            };

            charts = {
                orderFullfillment,
                productCategories,
                stockAvailablity,
                revenueDistribution,
                usersAgeGroup,
                adminCustomer,
            };

            nodeCache.set(key, JSON.stringify(charts));
        }

        return res.status(200).json({
            success: true,
            charts
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            error: "Internal Server Error"
        });
    }
});

export const barCharts = asyncHandler(async (req: Request, res: Response) => {
    let charts: any;
    const key = "admin-bar-charts";

    try {
        if (nodeCache.has(key)) {
            charts = JSON.parse(nodeCache.get(key) as string);
        } else {
            const today = new Date();
            const sixMonthAgo = new Date(today.getFullYear(), today.getMonth() - 6, 1);
            const twelveMonthAgo = new Date().setMonth(today.getMonth() - 12);

            const sixMonthProductPromise = Product.find({
                createdAt: {
                    $gte: sixMonthAgo,
                    $lte: today
                }
            }).select("createdAt");

            const sixMonthUsersPromise = User.find({
                createdAt: {
                    $gte: sixMonthAgo,
                    $lte: today
                }
            }).select("createdAt");

            const twelveMonthOrdersPromise = Order.find({
                createdAt: {
                    $gte: sixMonthAgo,
                    $lte: today
                }
            }).select("createdAt");

            const [products, users, orders] = await Promise.all([
                sixMonthProductPromise,
                sixMonthUsersPromise,
                twelveMonthOrdersPromise
            ]);

            const productCounts = getChartData({ length: 6, today, docArr: products });
            const usersCounts = getChartData({ length: 6, today, docArr: users });
            const ordersCounts = getChartData({ length: 12, today, docArr: orders });

            charts = {
                users: usersCounts,
                products: productCounts,
                orders: ordersCounts,
            };

            nodeCache.set(key, JSON.stringify(charts));
        }

        return res.status(200).json({
            success: true,
            charts
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            error: "Internal Server Error"
        });
    }
});

export const lineCharts = asyncHandler(async (req: Request, res: Response) => {
    let charts: any;
    const key = "admin-line-charts";

    try {
        if (nodeCache.has(key)) {
            charts = JSON.parse(nodeCache.get(key) as string);
        } else {
            const today = new Date();
            const twelveMonthsAgo = new Date();
            twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

            const baseQuery = {
                createdAt: {
                    $gte: twelveMonthsAgo,
                    $lte: today,
                },
            };

            const [products, users, orders] = await Promise.all([
                Product.find(baseQuery).select("createdAt"),
                User.find(baseQuery).select("createdAt"),
                Order.find(baseQuery).select(["createdAt", "discount", "total"]),
            ]);

            const productCounts = getChartData({ length: 12, today, docArr: products });
            const usersCounts = getChartData({ length: 12, today, docArr: users });
            const discount = getChartData({
                length: 12,
                today,
                docArr: orders,
                property: "discount",
            });
            const revenue = getChartData({
                length: 12,
                today,
                docArr: orders,
                property: "total",
            });

            charts = {
                users: usersCounts,
                products: productCounts,
                discount,
                revenue,
            };

            nodeCache.set(key, JSON.stringify(charts));
        }

        return res.status(200).json({
            success: true,
            charts
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            error: "Internal Server Error"
        });
    }
});
