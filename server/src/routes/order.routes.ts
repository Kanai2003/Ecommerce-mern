import { Router } from "express";
import { adminOnly } from "../middlewares/auth.middleware.js";
import {
    newOrder, 
    myOrders,
    allOrders,
    deleteOrder,
    processOrder,
    getSingleOrder
} from "../controllers/order.controller.js"


const router = Router()


router.route("/new").post(newOrder)

router.get("/my", myOrders)

router.get("/all", adminOnly, allOrders)

router.route("/:id")
    .get(getSingleOrder)
    .delete(adminOnly, deleteOrder)
    .patch(adminOnly, processOrder)


export default router