import { Router } from "express";
import {
    register,
    getAllUser,
    getUser,
    deleteUser
} from "../controllers/user.controller.js"
import { adminOnly } from "../middlewares/auth.middleware.js";

const router = Router()

router
    .post("/new", register)
    .get("/:id", getUser)
    .delete("/:id", deleteUser)

router.get("/all", adminOnly, getAllUser)

export default router