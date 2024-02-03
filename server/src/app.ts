import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    }),
);

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use("/public", express.static("../public/temp"));

// import routes
import HealthRouter from "./routes/health.routes.js"
import UserRouter from "./routes/user.routes.js"
import ProduRouter from "./routes/product.routes.js"


// routes declaration
app.use("/api/v1/health", HealthRouter)
app.use("/api/v1/user", UserRouter)
app.use("/api/v1/product", ProduRouter)



export { app };