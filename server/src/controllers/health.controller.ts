import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const healthCheck = asyncHandler( async (req, res)=> {
    return res.status(200).json({
        success: true,
        message: "Everything is fine!"
    })
})