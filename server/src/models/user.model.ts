import mongoose from "mongoose";
import validator from "validator";

interface IUser extends Document {
    username: string;
    name: string;
    email: string;
    photo: string;
    role: "user" | "admin";
    gender: "male" | "female" | "others";
    dob: Date;
    createdAt: Date;
    updatedAt: Date;
    // virtual attribut
    age: number;
}

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            unique: [true, "username already exists"],
            required: [true, "Please Enter username"]
        },
        name: {
            type: String,
            required: [true, "Please Enter Name"]
        },
        email: {
            type: String,
            unique: [true, "Email already Exist"],
            required: [true, "Please enter Name"],
            validate: validator.default.isEmail,
        },
        photo: {
            type: String
        },
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user"
        },
        gender: {
            type: String,
            enum: ["male", "female", "others"],
            required: [true, "Please enter Gender"],
        },
        dob: {
            type: Date,
            required: [true, "Please enter date of birth"]
        }

    }, { timestamps: true }
)

// calculate age attribute virtually
userSchema.virtual("age").get(function () {
    const today = new Date()
    const dob = this.dob
    let age = today.getFullYear() - dob.getFullYear()

    if ( today.getMonth() < dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())) {
        age--
    }
})

export const User = mongoose.model<IUser>("User", userSchema);