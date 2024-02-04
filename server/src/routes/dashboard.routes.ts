import { Router } from "express";
import { adminOnly } from "../middlewares/auth.middleware.js";
import {
    dashboardStats,
    pieCharts,
    barCharts,
    lineCharts
} from "../controllers/dashboard.controller.js"


const router = Router()

router.use(adminOnly)

router.get("/stats", dashboardStats)

router.get("/pie", pieCharts)

router.get("/bar", barCharts)

router.get("/line", lineCharts)

export default router