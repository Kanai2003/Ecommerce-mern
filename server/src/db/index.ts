import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(
            `${process.env.MONGODB_URI}`,
        );
        console.log(
            `\n🔗 MONGODB connected! HOST: ${connectionInstance.connection.host}`,
        );
    } catch (error) {
        console.log("🔴 MongoDB connection FAILED: ", error);
        process.exit(1);
    }
};

export default connectDB;