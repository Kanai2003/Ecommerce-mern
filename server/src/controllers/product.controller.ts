import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Product } from "../models/product.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { nodeCache } from "../app.js";
import { invalidateCache } from "../utils/features.js";
import { BaseQuery, NewProductRequestBody, SearchRequestQuery } from "../types/types.js";

export const newProduct = asyncHandler(async (
    req: Request<{}, {}, NewProductRequestBody>,
    res: Response,
    next: NextFunction
) => {
    const { name, category, price, stock } = req.body;
    const localphoto = req.file?.path;
    
    if (!(name && category && price && stock)) {
        throw new ApiError(400, "All fields are required!");
    }

    const photo = await uploadOnCloudinary(localphoto);

    if (!photo) {
        throw new ApiError(500, "Failed to upload photo!");
    }

    const product = await Product.create({
        name,
        price,
        stock,
        category: category.toLowerCase(),
        photo: photo.url
    });

    if (!product) {
        throw new ApiError(500, "Failed to create product!");
    }

    return res.status(201).json({
        success: true,
        product,
    });
});

export const getProduct = asyncHandler(async (req, res) => {
    const id = req.params.id;
    let product;

    if (nodeCache.has(`product-${id}`)) {
        product = JSON.parse(nodeCache.get(`product-${id}`) as string);
    } else {
        product = await Product.findById(id);

        if (!product) {
            throw new ApiError(404, "Product not found!");
        }

        nodeCache.set(`product-${id}`, JSON.stringify(product));
    }

    return res.status(200).json({
        success: true,
        product,
    });
});

export const updateProduct = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { name, price, stock, category } = req.body;

    const product = await Product.findById(id);
    
    if (!product) {
        throw new ApiError(404, "Product not found!");
    }

    if (name) product.name = name;
    if (price) product.price = price;
    if (stock) product.stock = stock;
    if (category) product.category = category.toLowerCase();

    await product.save();

    invalidateCache({
        product: true,
        productId: String(product._id),
        admin: true,
    });

    return res.status(200).json({
        success: true,
        message: "Product updated successfully!",
        updatedProduct: product,
    });
});

export const deleteProduct = asyncHandler(async (req, res) => {
    const id = req.params.id;
    const product = await Product.findById(id);

    if (!product) {
        throw new ApiError(404, "Product not found!");
    }

    await product.deleteOne();

    invalidateCache({
        product: true,
        productId: String(product._id),
        admin: true,
    });

    return res.status(200).json({
        success: true,
        message: "Product deleted successfully",
    });
});

export const latestProduct = asyncHandler(async (req, res) => {
    const products = await Product.find({}).sort({ createdAt: -1 }).limit(10);

    return res.status(200).json({
        success: true,
        products,
    });
});

export const allCategories = asyncHandler(async (req, res) => {
    let categories;

    if (nodeCache.has("categories")) {
        categories = JSON.parse(nodeCache.get("categories") as string);
    } else {
        categories = await Product.distinct("category");
        nodeCache.set("categories", JSON.stringify(categories));
    }

    return res.status(200).json({
        success: true,
        categories,
    });
});

export const getAllProducts = asyncHandler(async (
    req: Request<{}, {}, {}, SearchRequestQuery>,
    res: Response
) => {
    const { search, sort, category, price } = req.query;
    const page = Number(req.query.page) || 1;
    const limit = Number(process.env.PRODUCT_PER_PAGE) || 8;
    const skip = (page - 1) * limit;

    const baseQuery: BaseQuery = {};

    if (search) {
        baseQuery.name = {
            $regex: search,
            $options: "i"
        };
    }

    if (price) {
        baseQuery.price = {
            $lte: Number(price)
        };
    }

    if (category) {
        baseQuery.category = category;
    }

    const products = await Product.find(baseQuery)
        .sort(sort && { price: sort === "asc" ? 1 : -1 })
        .limit(limit)
        .skip(skip);

    const totalPage = Math.ceil(products.length / limit);

    return res.status(200).json({
        success: true,
        products,
        totalPage,
    });
});

export const getAdminProducts = asyncHandler(async (req, res, next) => {
    let products;

    if (nodeCache.has("all-products")) {
        products = JSON.parse(nodeCache.get("all-products") as string);
    } else {
        products = await Product.find({});
        nodeCache.set("all-products", JSON.stringify(products));
    }

    return res.status(200).json({
        success: true,
        products,
    });
});
