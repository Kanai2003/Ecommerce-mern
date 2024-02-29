import mongoose, { Document } from "mongoose";

export interface CouponModel extends Document {
  code: string;
  amount: number;
}

const schema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, "Please enter the Coupon Code"],
    unique: true,
  },
  amount: {
    type: Number,
    required: [true, "Please enter the Discount Amount"],
  },
});

export const Coupon = mongoose.model<CouponModel>("Coupon", schema);
