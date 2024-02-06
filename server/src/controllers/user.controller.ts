import { Request, Response, NextFunction } from "express";
import mongoose, {ObjectId} from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { IUser, User } from "../models/user.model.js";
import { NewUserRequestBody } from "../types/types.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"

export interface AuthenticatedRequest extends Request {
    user?: IUser 
}


// generate access token and refresh token
const generateAccessAndRefreshToken = async (userId: ObjectId) => {
    try {
        // Find the user by userId
        const user = await User.findById(userId);
        if (!user) {
            throw new Error("User not found");
        }

        // Generate access and refresh tokens
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        // Update user's refreshToken field and save to the database
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        // Return tokens
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating tokens");
    }
};

// user register
export const register = asyncHandler(async (
    req: Request<{}, {}, NewUserRequestBody>,
    res: Response,
    next: NextFunction
) => {
    const { username, password, name, email, gender, dob } = req.body

    if (!(username || password || name || email || gender || dob)) {
        throw new ApiError(401, "All fields are required!")
    }

    const findUser = await User.findOne({ $or: [{ username }, { email }] })
    if (findUser) {
        throw new ApiError(400, "Username or email already exist")
    }

    const localphoto = req.file?.path
    const photo: any = await uploadOnCloudinary(localphoto)

    // Extract secure_url from the photo object
    const photoUrl = photo.secure_url || "";

    const user = await User.create({
        username: username.toLowerCase(),
        password,
        name,
        email,
        gender,
        dob: new Date(dob),
        photo: photoUrl // Use photoUrl instead of the entire photo object
    })

    const createdUser = await User.findById(user._id)

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while creating user!")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { createdUser }, "User created successfully!"))
})



// Login user
export const loginUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    // if both of username and email are empty
    if (!(username || email)) {
        throw new ApiError(400, "Username or email is required")
    }

    if (!password) {
        throw new ApiError(400, "Password is required")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(400, "User not found")
    }

    const isPasswordMatched = await user.isPasswordCorrect(password)

    if (!isPasswordMatched) {
        throw new ApiError(400, "Wrong password")
    }

    // const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user!._id.toString())

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)
    // disselect password and refreshToken from user object and send it to client as a cookies
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User logged in successfully"

            )
        )

})


// logout user
export const logoutUser = asyncHandler(async (req:AuthenticatedRequest, res: Response) => {
    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, {}, "User logged out successfully")
        )
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


