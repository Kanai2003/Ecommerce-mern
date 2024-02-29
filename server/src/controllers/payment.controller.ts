import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Coupon } from "../models/coupon.model.js";
import { stripe } from "../app.js";

export const createPaymentIntent = asyncHandler(async (req: Request, res: Response) => {
    const { amount } = req.body;

    if (!amount) {
        throw new ApiError(400, "Please enter the amount!");
    }

    const paymentIntent = await stripe.paymentIntents.create({
        amount: Number(amount) * 100,
        currency: "inr"
    });

    const client_secret = paymentIntent.client_secret;

    return res.status(200).json({
        success: true,
        client_secret
    });
});

export const newCoupon = asyncHandler(async (req: Request, res: Response) => {
    const { code, amount } = req.body;

    const coupon = await Coupon.create({ code, amount });

    if (!coupon) {
        throw new ApiError(500, "Failed to create Coupon!");
    }

    return res.status(200).json({
        success: true,
        message: `Coupon ${coupon.code} Created Successfully`,
    });
});

export const applyDiscount = asyncHandler(async (req: Request, res: Response) => {
    const { code } = req.query;

    const discount = await Coupon.findOne({ code });

    if (!discount) {
        throw new ApiError(400, `Coupon ${code} not found!`);
    }

    return res.status(200).json({
        success: true,
        discount,
    });
});

export const allCoupons = asyncHandler(async (req: Request, res: Response) => {
    const coupons = await Coupon.find({});

    if (!coupons) {
        throw new ApiError(404, "Coupons not found!");
    }

    return res.status(200).json({
        success: true,
        coupons,
    });
});

export const deleteCoupon = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const coupon = await Coupon.findByIdAndDelete(id);

    if (!coupon) {
        throw new ApiError(400, "Coupon not found!");
    }

    return res.status(200).json({
        success: true,
        message: `Coupon ${coupon.code} Deleted Successfully`,
    });
});
