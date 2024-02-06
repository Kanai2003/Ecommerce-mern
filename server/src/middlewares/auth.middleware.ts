import { Request, Response, NextFunction} from "express"
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { AuthenticatedRequest } from "../controllers/user.controller.js";
import jwt from "jsonwebtoken";

const adminOnly = asyncHandler( async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const  id  = req.user?._id

    if(!id){
        throw new ApiError(401, "Login first to access!")
    }

    const user = await User.findById(id)
    if(!user){
        throw new ApiError(401, "Inalid credential")
    }

    if(user.role !== "admin"){
        throw new ApiError(401, "You don't have power to access!")
    }

    next();
})


export const verifyJWT = async (req: AuthenticatedRequest, res: Response<any, Record<string, any>>, next: NextFunction) => {
    try {
        const token = req.cookies.accessToken || req.header("Authorization")?.replace("Bearer ", "");
    
        if (!token) {
            throw new Error("Unauthorized request");
        }

        // const decodedToken = jwt.verify(token, jwt_secret) as { _id: string }; // Define the shape of the decoded token
        const decodedToken = jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET || "Ecommerce_mern_secret ",
        ) as { _id: string };
    
        const user = await User.findById(decodedToken._id).select("-password -refreshToken");
    
        if (!user) {
            throw new Error("Invalid Access Token");
        }
    
        req.user = user;
    
        next();
    } catch (error) {
        next(new ApiError(400, "Invalid Access Token"));
    }
};
export { adminOnly }