import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { Product } from "../models/product.model.js";
import { Order } from "../models/order.model.js";
import { Coupon } from "../models/coupon.model.js";
import { nodeCache } from "../app.js";
import { calculatePercentage, getChartData, getInventories } from "../utils/features.js";




export const dashboardStats = asyncHandler(async (req, res) => {
    let stats = {}
    const key = "admin-stats"

    if (nodeCache.has(key)) {
        stats = JSON.parse(nodeCache.get(key) as string)
    } else {
        const today = new Date()

        const sixMonthAgo = new Date(today.getFullYear(), today.getMonth() - 6, 1)

        const thisMonth = {
            start: new Date(today.getFullYear(), today.getMonth(), 1),
            end: today
        }

        const lastMonth = {
            start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
            end: new Date(today.getFullYear(), today.getMonth(), 0)
        }

        // Product Promise
        const thisMonthProductsPromise = Product.find({
            createdAt: {
                $gte: thisMonth.start,
                $lte: thisMonth.end
            }
        })
        const lastMonthProductsPromise = Product.find({
            createdAt: {
                $gte: lastMonth.start,
                $lte: lastMonth.end
            }
        })

        // User Promise
        const thisMonthUserPromise = User.find({
            createdAt: {
                $gte: thisMonth.start,
                $lte: thisMonth.end
            }
        })
        const lastMonthUserPromise = User.find({
            createdAt: {
                $gte: lastMonth.start,
                $lte: lastMonth.end
            }
        })

        // Order Promise
        const thisMonthOrderPromise = Order.find({
            createdAt: {
                $gte: thisMonth.start,
                $lte: thisMonth.end
            }
        })
        const lastMonthOrderPromise = Order.find({
            createdAt: {
                $gte: lastMonth.start,
                $lte: lastMonth.end
            }
        })

        const lastSixMonthOrderPromise = Order.find({
            createdAt: {
                $gte: sixMonthAgo,
                $lte: today,
            }
        })

        const latestTransactionsPromise = Order.find({})
            .select(["orderItems", "discount", "total", "status"])
            .limit(4)


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
            thisMonthProductsPromise,
            thisMonthUserPromise,
            thisMonthOrderPromise,
            lastMonthProductsPromise,
            lastMonthUserPromise,
            lastMonthOrderPromise,
            Product.countDocuments(),
            User.countDocuments(),
            Order.find({}).select("total"),
            lastSixMonthOrderPromise,
            Product.distinct("category"),
            User.countDocuments({ gender: "female" }),
            latestTransactionsPromise
        ])

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
            order: calculatePercentage(thisMonthOrder.length, lastMonthOrder.length),
        };

        const revenue = allOrders.reduce(
            (total, order) => total + (order.total || 0),
            0
        );

        const count = {
            revenue,
            product: productsCount,
            user: usersCount,
            order: allOrders.length,
        };

        const orderMonthCount = new Array(6).fill(0)
        const orderMonthRevenue = new Array(6).fill(0)

        lastSixMonthOrder.forEach((order) => {
            const creationDate = order.createdAt
            const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12

            if (monthDiff < 6) {
                orderMonthCount[6 - monthDiff - 1] += 1
                orderMonthRevenue[6 - monthDiff - 1] += order.total
            }
        })

        const categoriesCount = await getInventories({
            categories,
            productsCount
        })

        const userRatio = {
            male: usersCount - femaleUserCount,
            female: femaleUserCount
        }

        const modifiedLatestTransaction = latestTransactions.map((i) => ({
            _id: i._id,
            discount: i.discount,
            amount: i.total,
            quantity: i.orderItems.length,
            status: i.status,
        }));

        stats = {
            categoriesCount,
            changePercent,
            count,
            chart: {
                order: orderMonthCount,
                revenue: orderMonthRevenue,
            },
            userRatio,
            latestTransactions: modifiedLatestTransaction
        }

        nodeCache.set(key, JSON.stringify(stats))
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { stats }, "Stats fetched successfully!"))
})


export const pieCharts = asyncHandler(async (req, res) => {
    let charts;
    const key = "admin-pie-charts";

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
        ])

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
            teen: allUsers.filter((i) => i.age < 20).length,
            adult: allUsers.filter((i) => i.age >= 20 && i.age < 40).length,
            old: allUsers.filter((i) => i.age >= 40).length,
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

        nodeCache.set(key, JSON.stringify(charts))
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { charts }, "Stats fetched successfully!"))
})

export const barCharts = asyncHandler(async (req, res) => {
    let charts;
    const key = "admin-bar-charts";

    if (nodeCache.has(key)) {
        charts = JSON.parse(nodeCache.get(key) as string)
    } else {
        const today = new Date()

        const sixMonthAgo = new Date(today.getFullYear(), today.getMonth() - 6, 1)
        const twelveMonthAgo = new Date().setMonth(today.getMonth() - 12)

        const sixMonthProductPromise = Product.find({
            createdAt: {
                $gte: sixMonthAgo,
                $lte: today
            }
        }).select("createdAt")

        const sixMonthUsersPromise = User.find({
            createdAt: {
                $gte: sixMonthAgo,
                $lte: today
            }
        }).select("createdAt")

        const twelveMonthOrdersPromise = Order.find({
            createdAt: {
                $gte: sixMonthAgo,
                $lte: today
            }
        }).select("createdAt")

        const [products, users, orders] = await Promise.all([
            sixMonthProductPromise,
            sixMonthUsersPromise,
            twelveMonthOrdersPromise
        ])

        const productCounts = getChartData({ length: 6, today, docArr: products })
        const usersCounts = getChartData({ length: 6, today, docArr: users });
        const ordersCounts = getChartData({ length: 12, today, docArr: orders });

        charts = {
            users: usersCounts,
            products: productCounts,
            orders: ordersCounts,
        };

        nodeCache.set(key, JSON.stringify(charts));
    }


    return res
        .status(200)
        .json(new ApiResponse(200, { charts }, "Stats fetched successfully!"))
})

export const lineCharts = asyncHandler(async (req, res) => {
    let charts;
    const key = "admin-line-charts";

    if (nodeCache.has(key)){
        charts = JSON.parse(nodeCache.get(key) as string);
    }
    else {
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

    return res
        .status(200)
        .json(new ApiResponse(200, { charts }, "Stats fetched successfully!"))
})