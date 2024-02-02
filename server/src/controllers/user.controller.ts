import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";



// user register
const register = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { username, name, email, gender, dob, photo } = req.body

    if (!(username || name || email || gender || dob)) {
        throw new ApiError(401, "All fields are required!")
    }

    const findUser = await User.findOne({ $or: [{ username }, { email }] })
    if (findUser) {
        throw new ApiError(400, "ID already exists!")
    }

    const user = await User.create({
        username,
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


// get all user
const getAllUser = asyncHandler(async (req: Request, res: Response) => {
    const users = await User.find({})

    if (!users) {
        throw new ApiError(404, "No user found!")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { users }, "User found successfully!"))
})

// get user by id
const getUser = asyncHandler(async (req: Request, res: Response) => {
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
const deleteUser = asyncHandler( async (req: Request, res: Response)=> {
    const id = req.params.id
    const user = await User.findById(id)

    if(!user){
        throw  new ApiError(404, "User not found!")
    }

    await user.deleteOne();

    return res
            .status(200)
            .json(new ApiResponse(200, {}, "User deleted Successfully!"))
})




export {
    register,
    getAllUser,
    getUser,
    deleteUser
}