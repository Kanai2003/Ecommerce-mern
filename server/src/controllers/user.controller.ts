import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { NewUserRequestBody } from "../types/types.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"


// user register
export const register = asyncHandler(async (
    req: Request<{}, {}, NewUserRequestBody>,
    res: Response,
    next: NextFunction
) => {
    const { name, email, photo, gender, _id, dob } = req.body;

    let user = await User.findById(_id);

    if (user)
        return res.status(200).json({
            success: true,
            message: `Welcome, ${user.name}`,
        });

    if (!_id || !name || !email || !photo || !gender || !dob) {
        throw new ApiError(400, "Please add all fields")
    }

    user = await User.create({
        name,
        email,
        photo,
        gender,
        _id,
        dob: new Date(dob),
    });

    return res.status(201).json({
        success: true,
        message: `Welcome, ${user.name}`,
    });
})

// get all user
export const getAllUser = asyncHandler(async (req: Request, res: Response) => {
    const users = await User.find({})

    if (!users) {
        throw new ApiError(404, "No user found!")
    }

    return res.status(200).json({
        success: true,
        users
    })
})

// get user by id
export const getUser = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id

    const user = await User.findById(id)

    if (!user) {
        throw new ApiError(404, "User not found!")
    }

    return res.status(200).json({
        success: true,
        user
    })
})

// delete user
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id
    const user = await User.findById(id)

    if (!user) {
        throw new ApiError(404, "User not found!")
    }

    await user.deleteOne();

    return res.status(200).json({
        success: true,
        message: "User Deleted Successfully",
    });
})


