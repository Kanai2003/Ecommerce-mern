import mongoose, { Document, Schema } from "mongoose";

// Interface representing the structure of the Product document
export interface ProductDocument extends Document {
    name: string;
    photo: string;
    price: number;
    stock: number;
    category: string;
    createdAt: Date;
    updatedAt: Date;
}

const productSchema = new Schema<ProductDocument>(
    {
        name: {
            type: String,
            required: [true, "Please enter Name"],
        },
        photo: {
            type: String,
            required: [true, "Please enter Photo"],
        },
        price: {
            type: Number,
            required: [true, "Please enter Price"],
        },
        stock: {
            type: Number,
            required: [true, "Please enter Stock"],
        },
        category: {
            type: String,
            required: [true, "Please enter Category"],
            trim: true,
        },
    },
    { timestamps: true }
);

export const Product = mongoose.model<ProductDocument>("Product", productSchema);
