import { Router } from "express";
import {
    register,
    getAllUser,
    getUser,
    deleteUser,
    loginUser,
    logoutUser
} from "../controllers/user.controller.js"
import { adminOnly, verifyJWT } from "../middlewares/auth.middleware.js";
import { singleUpload } from "../middlewares/multer.middleware.js";


const router = Router()

router.post("/new", singleUpload, register)
    
router.route("/login").post(loginUser)

router.route("/logout").post(verifyJWT, logoutUser)

router.route("/getall").get(adminOnly, getAllUser)

router
    .route("/:id")
    .get( getUser)
    .delete( deleteUser)




export default router