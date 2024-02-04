import { Router } from "express";
import { adminOnly } from "../middlewares/auth.middleware.js";
import {
    newCoupon,
    applyDiscount,
    allCoupons,
    deleteCoupon
} from "../controllers/payment.controller.js"

const router = Router()


// router.post("/create", createPaymentIntent);

router.get("/discount", applyDiscount);

router.post("/coupon/new", adminOnly, newCoupon);

router.get("/coupon/all", adminOnly, allCoupons);

router.delete("/coupon/:id", adminOnly, deleteCoupon);

export default router