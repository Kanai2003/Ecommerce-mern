import { Request, Response, NextFunction} from "express"
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";

const adminOnly = asyncHandler( async (req: Request, res: Response, next: NextFunction) => {
    const  id  = req.query.id

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

export { adminOnly }