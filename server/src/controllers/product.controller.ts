import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Product } from "../models/product.model.js";
import { BaseQuery, NewProductRequestBody, SearchRequestQuery } from "../types/types.js"
import { rm } from "fs";
import { uploadOnCloudinary } from "../utils/cloudinary.js";


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

    return res
        .status(200)
        .json(new ApiResponse(200, { product }, "Product created successfully!"))
})

// get a single product by its id
export const getProduct = asyncHandler(async (req, res) => {
    const id = req.params.id
    const product = await Product.findById(id)

    if (!product) {
        throw new ApiError(404, "Product not found!")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { product }, "Product found successfully!"))
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

    // TODO: add invalidate cache

    const updatedProduct = await Product.findById(product._id)

    return res
        .status(200)
        .json(new ApiResponse(200, { updatedProduct }, "Product updated successfully!"))
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

    // TODO : add invalidator

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Product deleted successfully!"))
})


// get latest product
export const latestProduct = asyncHandler(async (req, res) => {
    const products = await Product.find({}).sort({ createdAt: -1 }).limit(10);

    return res
        .status(200)
        .json(new ApiResponse(200, { products }, "Latest products found successfully!"));
});



// get all categories
export const allCategories = asyncHandler(async (req, res) => {
    const categories = await Product.distinct("category")

    return res
        .status(200)
        .json(new ApiResponse(200, { categories }, "All categories successfully fetched!"))
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

    if(search){
        baseQuery.name = {
            $regex: search,
            $options: "i"
        }
    }

    if(price){
        baseQuery.price = {
            $lte: Number(price)
        }
    }

    if(category){
        baseQuery.category = category
    }

    const productPromise = await Product.find(baseQuery)
        .sort(sort && { price: sort==="asc"?1:-1})
        .limit(limit)
        .skip(skip)

    const [products, filteredOnlyProduct] = await Promise.all([
        productPromise,
        Product.find(baseQuery)
    ])

    const totalPage = Math.ceil(filteredOnlyProduct.length/limit)

    return res
        .status(200)
        .json(new ApiResponse(200, {products, totalPage}, "Product fetched successfully!"))
})