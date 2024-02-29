import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Order } from "../models/order.model.js";
import { User } from "../models/user.model.js";
import { invalidateCache, reduceStock } from "../utils/features.js";
import { nodeCache } from "../app.js";
import { NewOrderRequestBody } from "../types/types.js";

export const newOrder = asyncHandler(async (
    req: Request<{}, {}, NewOrderRequestBody>,
    res: Response
) => {
    const {
        shippingInfo,
        orderItems,
        user,
        subtotal,
        tax,
        shippingCharges,
        discount,
        total
    } = req.body;

    if (!(shippingInfo && orderItems && user && subtotal && tax && total)) {
        throw new ApiError(400, "All fields are required");
    }

    const dbUser = await User.findOne({ _id: user });

    if (!dbUser) {
        throw new ApiError(404, "User not found");
    }

    const order = await Order.create({
        shippingInfo,
        orderItems,
        user: dbUser._id,
        subtotal,
        tax,
        shippingCharges,
        discount,
        total
    });

    await reduceStock(orderItems);

    invalidateCache({
        product: true,
        order: true,
        admin: true,
        userId: user,
        orderId: order._id.toString(),
    });

    return res.status(200).json({
        success: true,
        order
    });
});

export const myOrders = asyncHandler(async (req, res) => {
    const { id: user } = req.query;

    const key = `my-orders-${user}`;
    let orders = [];

    if (nodeCache.has(key)) {
        orders = JSON.parse(nodeCache.get(key) as string);
    } else {
        orders = await Order.find({ user });
        nodeCache.set(key, JSON.stringify(orders));
    }

    return res.status(200).json({
        success: true,
        orders,
    });
});

export const allOrders = asyncHandler(async (req, res) => {
    const key = `all-orders`;
    let orders = [];

    if (nodeCache.has(key)) {
        orders = JSON.parse(nodeCache.get(key) as string);
    } else {
        orders = await Order.find({});
        nodeCache.set(key, JSON.stringify(orders));
    }

    return res.status(200).json({
        success: true,
        orders
    });
});

export const processOrder = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const order = await Order.findById(id);

    if (!order) {
        throw new ApiError(404, "Order not found!");
    }

    switch (order.status) {
        case "Processing":
            order.status = "Shipped";
            break;
        case "Shipped":
            order.status = "Delivered";
            break;
        default:
            order.status = "Delivered";
            break;
    }

    await order.save();

    invalidateCache({
        product: false,
        order: true,
        admin: true,
        userId: order.user,
        orderId: order._id.toString()
    });

    return res.status(200).json({
        success: true,
        message: `Order ${order.status} Successfully!`
    });
});

export const deleteOrder = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) {
        throw new ApiError(404, "Order not found!");
    }

    await order.deleteOne();

    invalidateCache({
        product: false,
        order: true,
        admin: true,
        userId: order.user,
        orderId: order._id.toString(),
    });

    return res.status(200).json({
        success: true,
        message: "Order Deleted Successfully",
    });
});

export const getSingleOrder = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const key = `order-${id}`;

    let order;

    if (nodeCache.has(key)) {
        order = JSON.parse(nodeCache.get(key) as string);
    } else {
        order = await Order.findById(id).populate("user", "name");
        if (!order) {
            throw new ApiError(404, "Order not found!");
        }
        nodeCache.set(key, JSON.stringify(order));
    }

    return res.status(200).json({
        success: true,
        order
    });
});
