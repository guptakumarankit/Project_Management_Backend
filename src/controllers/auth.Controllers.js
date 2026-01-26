import { User } from "../modules/user.models.js";
import { ApiResponse } from '../utils/api-response.js'
import { ApiError } from '../utils/api-Error.js'
import { asyncHandler } from '../utils/async-handler.js'
import {emailVerificationMailgenContent, forgetPasswordMailgenContent, sendEmail} from '../utils/mail.js'
import jwt from 'jsonwebtoken'

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
    const {email , username , password , fullName } = req.body;

    const existedUser = await User.findOne({
        $or:[{username} , {email}]
    })

    if(existedUser){
        throw new ApiError(409 , "User with email or username already exists")
    }

    // save in dataBase 
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

    // send to mail 
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
      
        if(!email || !password || !username){
            throw new ApiError("All field is required")
        }

        const user = await User.findOne({email});

        if(!user){
            throw new ApiError(400 , "User doesn't exists")
        }

        const isPasswordCorrect = await user.isPasswordCorrect(password)
        console.log(isPasswordCorrect)

        if(!isPasswordCorrect){
            throw new ApiError(400 , "Invalid Password")
        }

        console.log("password correct")

        const {accessToken , refreshToken} = await generateAccessAndRefreshTokens(user._id);

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
        throw new ApiError(error)
    }
}

const logout = asyncHandler(async(req ,res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken: "",
            },
        },
        {
            new : true,
        },
    );

    const options = {
        httpOnly:true,
        secure:true
    }

    return res
        .status(200)
        .clearCookie("accessToken" , options)
        .clearCookie("refreshToken" , options)
        .json(new ApiResponse(200 , {} , "User logged out"))
})

const getCurrentUser = asyncHandler(async (req , res) => {
    return res
        .status(200)
        .json(new ApiResponse(200 , req.user , "Current User fetched Successfully"));
});

const verifyEmail = asyncHandler(async (req , res) => {
    const { verificationToken } = req.body;

    if(!verificationToken){
        throw new ApiError(400 , "Email verification token is missing")
    }

    let hashedToken = crypto
        .createHash("sha256")
        .update(verificationToken)
        .digest("hex")
    
    const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpiry : {$gt: Date.now()}
    })

    if(!user){
        throw new ApiError(400 , "Email is inValid or expired");
    }

    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;

    user.isEmailVerified = true
    await user.save({validateBeforeSave : false})

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    isEmailVerified : true
                },
                "Email is verified",
            )
        )
})

const resentEmailVerification = asyncHandler(async (req , res) => {
    const user = await User.findById(req.user?._id);

    if(!user){
        throw new ApiError(404 , "User does not exist")
    }

    if(user.isEmailVerified){
        throw new ApiError(409 , "Email is already verified")
    }

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

    return res
        .status(200)
        .json(
            new ApiResponse(
                200 ,
                {} ,
                "Mail has been send to your email Id"
            )
        ) 
})

const refreshAccessToken = asyncHandler(async(req , res) => {
    try {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401 , "Unauthorized access")
    }
    
        const decodedToken = jwt.verify(incomingRefreshToken , process.env.REFRESH_TOKEN_SECRET)

        console.log("DecodedToken" , decodedToken);

        const user = await User.findById(decodedToken?._id);

        if(!user){
            throw new ApiError(401 , "Invalid refresh token");
        }

        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401 , "Refresh token in expired");
        }

        const options = {
            httpOnly : true ,
            secure : true 
        }

        const {accessToken , refreshToken: newRefreshToken} = await generateAccessAndRefreshTokens(user._id);

        user.refreshToken = newRefreshToken;
        await user.save()

        return res
            .status(200)
            .cookie("accessToken" , accessToken , options)
            .cookie("refreshToken" , newRefreshToken , options)
            .json(
                new ApiResponse(
                    200 , 
                    {accessToken , refreshToken : newRefreshToken},
                    "Access token refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(401 , "Invalid Refresh token")
    }
})

const forgetPasswordRequest = asyncHandler(async(req , res) => {
    const { email } = req.body
    const user = await User.findOne({email})

    if(!user){
        throw new ApiError(404 , "User doesn't exists" , [])
    }

    const { unHashedToken , hashedToken , tokenExpiry } = user.generateTemporaryToken();

    console.log(unHashedToken);

    user.forgetPassword = hashedToken;
    user.forgetPasswordExpiry = tokenExpiry;

    await user.save({validateBeforeSave : false})

    // send to mail for forgot password 
    await sendEmail({
        email: user?.email,
        subject : "Password reset request",
        mailgenContent: forgetPasswordMailgenContent(
            user.username,
            `${process.env.FORGET_PASSWORD_REDIRECT_URL}/${unHashedToken}`
        ),
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Password reset mail has been send on your mail id"
            )
        )
})

// not run 
const resetForgotPassword = asyncHandler(async(req , res) => {
    const { resetToken } = req.params
    const { newPassword } = req.body

    console.log(resetToken , "===>" , newPassword)
    
    let hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex")

    const user = await User.findOne({
        forgotPasswordToken: hashedToken,
        forgetPasswordExpiry: {$gt: Date.now()}
    })

    if(!user){
        throw new ApiError(489 , "Token is invalid or expired")
    }

    user.forgetPasswordExpiry = undefined
    user.forgetPassword = undefined

    user.password = newPassword
    await user.save({validateBeforeSave : false})

    return res
        .status(200)
        .json(
            new ApiResponse(
                200 , 
                {},
                "Password reset successfully"
            )
        )
}) 

const changeCurrentPassword = asyncHandler(async(req , res) => {
    const { oldPassword , newPassword } = req.body
    const user = await User.findById(req.user?._id)

    const isPasswordValid = await user.isPasswordCorrect(oldPassword)

    user.password = newPassword
    await user.save({validateBeforeSave : false})

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Password changed successfully"
            )
        )
})

export { 
    registerUser , 
    login , 
    logout , 
    getCurrentUser , 
    verifyEmail,
    resentEmailVerification,
    refreshAccessToken,
    forgetPasswordRequest,
    changeCurrentPassword,
    resetForgotPassword
};