import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { NewUserRequestBody } from "../types/types.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


// user register
export const register = asyncHandler(async (
    req: Request<{}, {}, NewUserRequestBody>,
    res: Response,
    next: NextFunction
) => {
    const { _id, name, email, gender, dob, photo } = req.body

    if (!(_id || name || email || gender || dob)) {
        throw new ApiError(401, "All fields are required!")
    }

    const findUser = await User.findOne({ $or: [{ _id }, { email }] })
    if (findUser) {
        throw new ApiError(400, "ID already exists!")
    }

    const user = await User.create({
        _id,
        name,
        email,
        gender,
        dob: new Date(dob),
        photo: photo || ""
    })

    const createdUser = await User.findById(user._id)

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while creating user!")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { createdUser }, "User created successfully!"))
})

// fix: this route is not working 
// get all user
export const getAllUser = asyncHandler(async (req: Request, res: Response) => { 
    const users = await User.find({})

    if (!users) {
        throw new ApiError(404, "No user found!")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { users }, "User found successfully!"))
})

// get user by id
export const getUser = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id

    const user = await User.findById(id)

    if (!user) {
        throw new ApiError(404, "User not found!")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, user, "User found successfully!"))
})

// delete user
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id
    const user = await User.findById(id)

    if (!user) {
        throw new ApiError(404, "User not found!")
    }

    await user.deleteOne();

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "User deleted Successfully!"))
})


