import mongoose, { Document } from "mongoose";
import validator from "validator";

// Interface representing the structure of the User document
export interface IUser extends Document {
    _id: string;
    name: string;
    email: string;
    photo: string;
    role: "admin" | "user";
    gender: "male" | "female";
    dob: Date;
    createdAt: Date;
    updatedAt: Date;
    // Virtual Attribute
    age: number;
}

const userSchema = new mongoose.Schema(
    {
        _id: {
            type: String,
            required: [true, "Please enter ID"],
        },
        name: {
            type: String,
            required: [true, "Please enter Name"],
        },
        email: {
            type: String,
            unique: [true, "Email already exists"],
            required: [true, "Please enter Email"],
            validate: [validator.isEmail, "Please enter a valid Email"],
        },
        photo: {
            type: String,
            required: [true, "Please add Photo"],
        },
        role: {
            type: String,
            enum: ["admin", "user"],
            default: "user",
        },
        gender: {
            type: String,
            enum: ["male", "female"],
            required: [true, "Please enter Gender"],
        },
        dob: {
            type: Date,
            required: [true, "Please enter Date of Birth"],
        },
    },
    {
        timestamps: true,
    }
);

// Define a virtual attribute for age calculation
userSchema.virtual("age").get(function (this: { dob: Date }) {
    const today = new Date();
    const dob: any = this.dob;
    let age = today.getFullYear() - dob.getFullYear();

    if (
        today.getMonth() < dob.getMonth() ||
        (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())
    ) {
        age--;
    }

    return age;
});

export const User = mongoose.model<IUser>("User", userSchema);
