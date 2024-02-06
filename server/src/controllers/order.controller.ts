import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { NewOrderRequestBody } from "../types/types.js";
import { Order } from "../models/order.model.js";
import NodeCache from "node-cache";
import { invalidateCache, reduceStock } from "../utils/features.js"
import { User } from "../models/user.model.js";
import { nodeCache } from "../app.js";



// create a new order
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
    } = req.body

    if (!(shippingInfo || orderItems || user || subtotal || tax || total)) {
        throw new ApiError(400, "All fields are required")
    }

    const dbUser = await User.findOne({ _id: user })

    const order = await Order.create({
        shippingInfo,
        orderItems,
        user: dbUser?._id,
        subtotal,
        tax,
        shippingCharges,
        discount,
        total
    })

    await reduceStock(orderItems)

    invalidateCache({
        product: true,
        order: true,
        admin: true,
        userId: user,
        productId: order.orderItems?.map((i) => String(i.productId)),
    })

    return res
        .status(200)
        .json(new ApiResponse(200, { order }, "Order Placed Successfully!"))
})

// get my all orders
export const myOrders = asyncHandler(async (req, res) => {
    const { id: user } = req.query

    const key = `my-orders-${user}`
    let orders = [];

    if (nodeCache.has(key)) {
        orders = JSON.parse(nodeCache.get(key) as string)
    } else {
        orders = await Order.find({ user })
        nodeCache.set(key, JSON.stringify(orders))
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { orders }, "Order fetched successfully!"))
})

// get all orders --admin
export const allOrders = asyncHandler(async (req, res) => {

    const key = `all-orders`
    let orders = [];

    if (nodeCache.has(key)) {
        orders = JSON.parse(nodeCache.get(key) as string)
    } else {
        orders = await Order.find({})
        nodeCache.set(key, JSON.stringify(orders))
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { orders }, "Order fetched successfully!"))
})


// Process order
export const processOrder = asyncHandler(async (req, res) => {
    const { id } = req.params

    const order = await Order.findById(id)

    if (!order) {
        throw new ApiError(404, "Order nor found!")
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

    await order.save()

    invalidateCache({
        product: false,
        order: true,
        admin: true,
        userId: order.user,
        orderId: String(order._id)
    })

    return res
        .status(200)
        .json(new ApiResponse(200, {}, `Order ${order.status} Successfully!`))
})


// delete order
export const deleteOrder = asyncHandler(async (req, res) => {
    const { id } = req.params
    const order = await Order.findById(id)
    if (!order) {
        throw new ApiError(404, "Order not found!")
    }

    await order.deleteOne()

    invalidateCache({
        product: false,
        order: true,
        admin: true,
        userId: order.user,
        orderId: String(order._id),
    });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Order deleted successfully!"))
})


export const getSingleOrder = asyncHandler(async (req, res) => {
    const { id } = req.params
    const key = `order-${id}`

    let order;

    if (nodeCache.has(key)) {
        order = JSON.parse(nodeCache.get(key) as string)
    } else {
        order = await Order.findById(id).populate("user", "name")
        if (!order) {
            throw new ApiError(404, "Order not found!")
        }
        nodeCache.set(key, JSON.stringify(order));
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { order }, "Order fetched successfully!"))
})