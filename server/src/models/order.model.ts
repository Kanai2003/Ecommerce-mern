import mongoose, { Schema, Document } from "mongoose";

export interface OrderItem {
  name: string;
  photo: string;
  price: number;
  quantity: number;
  productId: mongoose.Types.ObjectId; // Assuming Product is defined elsewhere
}

interface OrderModel extends Document {
  shippingInfo: {
    address: string;
    city: string;
    state: string;
    country: string;
    pinCode: number;
  };
  user: string;
  subtotal: number;
  tax: number;
  shippingCharges: number;
  discount: number;
  total: number;
  status: "Processing" | "Shipped" | "Delivered";
  orderItems: OrderItem[];
}

const schema = new Schema<OrderModel>(
  {
    shippingInfo: {
      address: {
        type: String,
        required: [true, "Please provide the shipping address"],
      },
      city: {
        type: String,
        required: [true, "Please provide the city"],
      },
      state: {
        type: String,
        required: [true, "Please provide the state"],
      },
      country: {
        type: String,
        required: [true, "Please provide the country"],
      },
      pinCode: {
        type: Number,
        required: [true, "Please provide the pin code"],
      },
    },
    user: {
      type: String,
      required: [true, "Please provide the user"],
    },
    subtotal: {
      type: Number,
      required: [true, "Please provide the subtotal"],
    },
    tax: {
      type: Number,
      required: [true, "Please provide the tax"],
    },
    shippingCharges: {
      type: Number,
      required: [true, "Please provide the shipping charges"],
    },
    discount: {
      type: Number,
      required: [true, "Please provide the discount"],
    },
    total: {
      type: Number,
      required: [true, "Please provide the total"],
    },
    status: {
      type: String,
      enum: ["Processing", "Shipped", "Delivered"],
      default: "Processing",
    },
    orderItems: [
      {
        name: String,
        photo: String,
        price: Number,
        quantity: Number,
        productId: {
          type: mongoose.Types.ObjectId,
          ref: "Product",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Order = mongoose.model<OrderModel>("Order", schema);
