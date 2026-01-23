import { User } from "../modules/user.models.js";
import { ApiResponse } from '../utils/api-response.js'
import { ApiError } from '../utils/api-Error.js'
import { asyncHandler } from '../utils/async-handler.js'
import {emailVerificationMailgenContent, sendEmail} from '../utils/mail.js'

const generateAccessAndRefreshTokens = async (userId) =>{
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave : false});
        return {accessToken , refreshToken};
    } catch (error) {
        throw new ApiError(
            500 , "Something went wrong while generating access token", 
        )
    }
}

const registerUser = asyncHandler(async(req , res) => {
    console.log("controller")
    const {email , username , password , fullName } = req.body;

    const existedUser = await User.findOne({
        $or:[{username} , {email}]
    })

    if(existedUser){
        throw new ApiError(409 , "User with email or username already exists")
    }

    const user = await User.create({
        email , 
        password , 
        username , 
        fullName,
        isEmailVerified : false
    })

    const { unHashedToken , hashedToken , tokenExpiry } = user.generateTemporaryToken();

    user.emailVerificationToken  = hashedToken
    user.emailVerificationExpiry = tokenExpiry

    await user.save({validateBeforeSave : false})

    await sendEmail({
        email: user?.email,
        subject : "Please verify your email",
        mailgenContent: emailVerificationMailgenContent(
            user.username,
            `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`
        )
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken -emailVerification -emailVerificationExpiry",);

    if(!createdUser){
        throw new ApiError(500 , "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(
            200 ,
            {user : createdUser},
            "User registered successfully and verification email has been sent on your email"
        )
    )
})

const login = async(req , res) => {
    try {
        const {email , password , username} = req.body;
        console.log(email , password)
        if(!email || !password || username){
            throw new ApiError("All field is required")
        }

        const user = await User.findOne({email});
        if(!user){
            throw new ApiError(400 , "User doesn't exists")
        }

        const isPasswordCorrect = await user.isPasswordCorrect(password)

        if(!isPasswordCorrect){
            throw new ApiError(400 , "Invalid Password")
        }

        console.log("password correct")

        const {accessToken , refreshToken} = await  generateAccessAndRefreshTokens(user._id);

        console.log("accessToken" , accessToken)
        console.log("refreshToken" , refreshToken)

         const loggedInUser = await User.findById(user._id).select("-password -refreshToken -emailVerification -emailVerificationExpiry",);

         const options = {
            httpOnly: true,
            secure:true
         }

         return res
            .status(200)
            .cookie("accessToken" , accessToken , options)
            .cookie("refreshToken" , refreshToken , options)
            .json(
                new ApiResponse(
                    200 , 
                    {
                        user : loggedInUser,
                        accessToken , 
                        refreshToken
                    },
                    "User logged in Successfully"
                )
            )
    } catch (error) {
        console.log("Error part")
        throw new ApiError(error)
    }
}

export { registerUser , login};