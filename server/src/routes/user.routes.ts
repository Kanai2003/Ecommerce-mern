import { Router } from "express";
import {
    register,
    getAllUser,
    getUser,
    deleteUser
} from "../controllers/user.controller.js"
import { adminOnly } from "../middlewares/auth.middleware.js";


const router = Router()

router.post("/new", register)
    

router.route("/all").get(adminOnly, getAllUser)

router
    .route("/:id")
    .get( getUser)
    .delete( deleteUser)




export default router