import mongoose, { Schema } from "mongoose";
import bcrypt from 'bcrypt.js'
import jwt from 'jsonwebtoken'
import crypto from 'crypto-js'

const userSchema = new Schema({
    avatar:{
        type:{
            url:String,
            localPath: String,
        },
        default:{
            url:`https://placehold.co/200x200`,
            localPath: ""
        }
    },
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true
    },
    fullName:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:[true , "Password is required"]
    },
    isEmailVerified:{
        type:Boolean,
        default:true
    },
    refreshToken:{
        type:String
    },
    forgetPassword:{
        type:String
    },
    forgetPasswordExpiry:{
        type:Date
    },
    emailVerificationToken:{
        type : String
    },
    emailVerificationExpiry:{
        type : Date
    }
} , {timestamps: true});


userSchema.pre("save" , async function(next) {
    if(!this.isModified("Password")) return next();
    this.password = await bcrypt.hash(this.password , 10);
    next();
});

// check the password correct or not ? 
userSchema.methods.isPasswordCorrect = async function(password){
  return await bcrypt.compare(password , this.password)
}

// Generate access token 
userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username
        },
        process.env.ACCESS_TOKEN_SECRET,
        {expiresIn: process.env.ACCESS_TOKEN_EXPIRY}
    )
}

// Generate Refresh token 
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id:this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {expiresIn: process.env.REFRESH_TOKEN_EXPIRY}
    )
}


// Generate Temporary token 
userSchema.methods.generateTemporaryToken = function(){
    const unHashedToken = crypto.randomBytes(20).toString("hex")

    const hashedToken = crypto
        .createHash("sha256")
        .update(unHashedToken)
        .digest("hex")
    
    const tokenExpiry = Date.now() + (20 * 60 * 1000)  // 20 mins
    return {unHashedToken , hashedToken , tokenExpiry}
}

export const User = mongoose.model("User" , userSchema);