import { Router } from 'express';
import { registerUser } from '../controllers/auth.Controllers.js';

const router = Router();
router.post("/register" , registerUser);
console.log("authRoute");

export default router;