import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Coupon } from "../models/coupon.model.js";
import { stripe } from "../app.js";

export const createPaymentIntent = asyncHandler(async (req, res) => {
    const { amount } = req.body

    if(!amount){
        throw new ApiError(400, "Please enter amount!")
    }

    const paymentIntent = await stripe.paymentIntents.create({
        amount: Number(amount)*100,
        currency: "inr"
    })
    // instead of paymentIntent object sending only client_secret to frontend
    const client_secret = paymentIntent.client_secret
    return res
        .status(200)
        .json(new ApiResponse(200, {client_secret}, "Success!"))
})

export const newCoupon = asyncHandler(async (req, res)=> {
    const { code, amount } = req.body

    const coupon = await Coupon.create({code, amount})

    if(!coupon){
        throw new ApiError(500, "Something went wrong while creating Coupon!")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {coupon},`Coupon ${coupon.code} created successfully!`))
})


export const applyDiscount = asyncHandler(async (req, res)=> {
    const { code } = req.query

    const discount = await Coupon.find({code})

    if(!discount){
        throw new ApiError(400, `Coupon ${code} not found!`)
    }

    return res
        .status(200)
        .json( new ApiResponse(200, {discount}, "Coupon found successfyllu!"))
})


export const allCoupons = asyncHandler(async (req, res)=> {
    const coupons = await Coupon.find({})

    if(!coupons){
        throw new ApiError(404, "Coupon not found!")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {coupons}, "Coupons fetched successfully!"))
})

export const deleteCoupon = asyncHandler(async (req, res) => {
    const { id } = req.params

    const coupon = await Coupon.findByIdAndDelete(id)

    if(!coupon){
        throw new ApiError(400,"Coupon not found!")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Coupon deleted successfylly!"))
})