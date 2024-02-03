import { Router } from "express";
import { adminOnly } from "../middlewares/auth.middleware.js";
import {
    newProduct,
    getProduct,
    updateProduct,
    deleteProduct,
    latestProduct,
    allCategories,
    getAllProducts
} from "../controllers/product.controller.js"
import { singleUpload } from "../middlewares/multer.middleware.js";


const router = Router()


router.route("/all").get(getAllProducts)

router.route("/latest").get( latestProduct)

router.get("/categories", allCategories)


//To Create New Product  - /api/v1/product/new
router.post("/new", adminOnly, singleUpload, newProduct)

router.route("/:id")
    .get(getProduct)
    .patch( adminOnly, singleUpload, updateProduct)
    .delete( adminOnly, deleteProduct)




export default router