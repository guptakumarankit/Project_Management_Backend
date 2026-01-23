import { Router } from 'express';
import { registerUser , login } from '../controllers/auth.Controllers.js';
import { validate } from '../middlewares/validator.middleware.js';
import { userLoginValidator, userRegisterValidator } from '../validators/index.js';


const router = Router();
router.post("/register" , userRegisterValidator() , validate , registerUser);
router.post("/login" , userLoginValidator() , validate , login);
export default router;