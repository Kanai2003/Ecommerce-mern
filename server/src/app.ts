import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import NodeCache from "node-cache";
import Stripe from "stripe";
import morgan from "morgan";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "",
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use("/public", express.static("../public/temp"));

const stripeKey = process.env.STRIPE_KEY || "";
export const nodeCache = new NodeCache();
export const stripe = new Stripe(stripeKey);

// import routes
import HealthRouter from "./routes/health.routes";
import UserRouter from "./routes/user.routes";
import ProduRouter from "./routes/product.routes";
import OrderRouter from "./routes/order.routes";
import PaymentRouter from "./routes/payment.routes";
import DashboardRouter from "./routes/dashboard.routes";

// routes declaration
app.use("/api/v1/health", HealthRouter);
app.use("/api/v1/user", UserRouter);
app.use("/api/v1/product", ProduRouter);
app.use("/api/v1/order", OrderRouter);
app.use("/api/v1/payment", PaymentRouter);
app.use("/api/v1/dashboard", DashboardRouter);

export { app };
