import { Router } from "express";
import { adminOnly } from "../middlewares/auth.middleware.js";
import { healthCheck } from "../controllers/health.controller.js";

const router = Router()

router.get("/",adminOnly, healthCheck)

export default router