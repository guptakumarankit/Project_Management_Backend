import { Router } from 'express';
import { registerUser , login, logout, verifyEmail, refreshAccessToken, forgetPasswordRequest, resetForgotPassword, getCurrentUser, changeCurrentPassword, resentEmailVerification } from '../controllers/auth.Controllers.js';
import { validate } from '../middlewares/validator.middleware.js';
import { userChangeCurrentPasswordValidator, userForgotPasswordValidator, userLoginValidator, userRegisterValidator } from '../validators/index.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// unsecured routes 
router.post("/register" , userRegisterValidator() , validate , registerUser);
router.post("/login" , userLoginValidator() , validate , login);
// not run 
router.get("/verify-token/:verificationToken" , verifyEmail);
router.post("/refresh-token" , refreshAccessToken);
router.post("/forgot-password" , userForgotPasswordValidator() , validate , forgetPasswordRequest)
// not run 
router.post("/reset-password/:resetToken" , userForgotPasswordValidator() , validate , resetForgotPassword);

// secure routes
router.post("/logout" , verifyJWT ,  logout);
router.get("/current-user" , verifyJWT , getCurrentUser);
router.post("/change-password" , verifyJWT , userChangeCurrentPasswordValidator() , validate , changeCurrentPassword);
router.post("/resend-email-verification" , verifyJWT , resentEmailVerification)

export default router;