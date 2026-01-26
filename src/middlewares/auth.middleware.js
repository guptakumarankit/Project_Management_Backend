import dotenv from "dotenv";
dotenv.config();

import { User } from "../modules/user.models.js";
import { ApiError } from "../utils/api-Error.js";
import { asyncHandler } from "../utils/async-handler.js";
import jwt from 'jsonwebtoken'

export const verifyJWT = asyncHandler(async(req , res , next) => {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer " , "");

    if(!token){
        throw new ApiError(401 , "Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(token , process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken -emailVerification -emailVerificationExpiry");

        if(!user){
            throw new ApiError(401 , "Invalid access Token");
        }

        req.user = user;
        next()
    } catch (error) {
        throw new ApiError(401 , "Invalid access Token");
    }
}) 
