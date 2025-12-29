import { Router } from 'express'
import { healthCheck } from '../controllers/healthCheck.Controllers.js';

const router = Router();

router.get("/healthCheck" , healthCheck);

export default router;