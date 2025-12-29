import { ApiResponse } from '../utils/api-response.js'
import { asyncHandler } from '../utils/async-handler.js'

/*  // always write the catch block 
const healthCheck = async (req , res , next) => {
    try {
        res.status(200).json(new ApiResponse(200 , { message : "Server is running"}))
    } catch (error) {
        next(err)
    }
} 
*/

const healthCheck = asyncHandler(async(req , res) => {
    res.status(200).json(new ApiResponse(200 , {
        message : "Server is running"
    }));
});

export { healthCheck }