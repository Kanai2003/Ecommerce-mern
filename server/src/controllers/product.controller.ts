import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Product } from "../models/product.model.js";
import { BaseQuery, NewProductRequestBody, SearchRequestQuery } from "../types/types.js"
import { rm } from "fs";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { nodeCache } from "../app.js";
import { invalidateCache } from "../utils/features.js";


// add new product
export const newProduct = asyncHandler(async (
    req: Request<{}, {}, NewProductRequestBody>,
    res: Response,
    next: NextFunction
) => {
    const { name, category, price, stock } = req.body
    const localphoto = req.file?.path
    const photo = await uploadOnCloudinary(localphoto)


    if (!photo) {
        throw new ApiError(401, "Something went wrong while uploading the photo!")
    }

    if (!(name || price || category || stock)) {
        throw new ApiError(401, "All fields are required!")
    }

    const product = await Product.create({
        name,
        price,
        stock,
        category: category.toLowerCase(),
        photo: photo?.url
    })

    if (!product) {
        throw new ApiError(401, "Something went wrong while creating Product!")
    }

    return res.status(200).json({
        success: true,
        product,
    });
})

// get a single product by its id
export const getProduct = asyncHandler(async (req, res) => {
    let product;
    const id = req.params.id;
    if (nodeCache.has(`product-${id}`)) {
        product = JSON.parse(nodeCache.get(`product-${id}`) as string);
    } else {
        product = await Product.findById(id);

        if (!product) {
            throw new ApiError(404, "Product not found!")
        }

        nodeCache.set(`product-${id}`, JSON.stringify(product));
    }

    return res.status(200).json({
        success: true,
        product,
    });
})

// update product
export const updateProduct = asyncHandler(async (req, res, next) => {
    const { id } = req.params
    const { name, price, stock, category } = req.body

    const localphoto = req.file?.path

    const product = await Product.findById(id)
    if (!product) {
        throw new ApiError(404, "Product not found!")
    }

    if (localphoto) {
        rm(product.photo!, () => {
            console.log("Old Photo Deleted");
        });
        const cloudinaryPhoto = await uploadOnCloudinary(localphoto)
        product.photo = cloudinaryPhoto?.url || product.photo;
    }

    if (name) {
        product.name = name
    }
    if (price) {
        product.price = price
    }
    if (stock) {
        product.stock = stock
    }
    if (category) {
        product.category = category
    }

    await product.save()

    invalidateCache({
        product: true,
        productId: String(product._id),
        admin: true,
    });

    const updatedProduct = await Product.findById(product._id)

    return res.status(200).json({
        updatedProduct,
        message: "Product updated successfully!"
    })
})

// delete any product 
export const deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id)
    if (!product) {
        throw new ApiError(404, "Product not found!")
    }

    rm(product.photo!, () => {
        console.log("Product Photo Deleted!")
    })

    await product.deleteOne()

    invalidateCache({
        product: true,
        productId: String(product._id),
        admin: true,
    });

    return res.status(200).json({
        success: true,
        message: "Product deleted successfully"
    })
})


// get latest product
export const latestProduct = asyncHandler(async (req, res) => {
    // const products = await Product.find({}).sort({ createdAt: -1 }).limit(10)

    let products;

    if (nodeCache.has("latest-products")) {
        products = JSON.stringify(nodeCache.get("latest-products") as string)
    } else {
        products = await Product.find({}).sort({ createdAt: -1 }).limit(5);
        nodeCache.set("latest-products", JSON.stringify(products))
    }

    return res.status(200).json({
        success: true,
        products
    })
});



// get all categories
export const allCategories = asyncHandler(async (req, res) => {
    // const categories = await Product.distinct("category")

    let categories;

    if (nodeCache.has("categories")) {
        categories = JSON.parse(nodeCache.get("categories") as string);
    } else {
        categories = await Product.distinct("category");
        nodeCache.set("categories", JSON.stringify(categories));
    }

    return res.status(200).json({
        success: true,
        categories
    })
})


// get all products with filter
export const getAllProducts = asyncHandler(async (
    req: Request<{}, {}, {}, SearchRequestQuery>,
    res: Response
) => {
    const { search, sort, category, price } = req.query;

    const page = Number(req.query.page) || 1;

    const limit = Number(process.env.PRODUCT_PER_PAGE) || 8;
    const skip = (page - 1) * limit;

    const baseQuery: BaseQuery = {}

    if (search) {
        baseQuery.name = {
            $regex: search,
            $options: "i"
        }
    }

    if (price) {
        baseQuery.price = {
            $lte: Number(price)
        }
    }

    if (category) {
        baseQuery.category = category
    }

    const productPromise = await Product.find(baseQuery)
        .sort(sort && { price: sort === "asc" ? 1 : -1 })
        .limit(limit)
        .skip(skip)

    const [products, filteredOnlyProduct] = await Promise.all([
        productPromise,
        Product.find(baseQuery)
    ])

    const totalPage = Math.ceil(filteredOnlyProduct.length / limit)

    return res.status(200).json({
        success: true,
        products,
        totalPage,
    });
})


// Revalidate on New,Update,Delete Product & on New Order
export const getAdminProducts = asyncHandler(async (req, res, next) => {
    let products;
    if (nodeCache.has("all-products"))
        products = JSON.parse(nodeCache.get("all-products") as string);
    else {
        products = await Product.find({});
        nodeCache.set("all-products", JSON.stringify(products));
    }

    return res.status(200).json({
        success: true,
        products,
    });
});