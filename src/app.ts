import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { redis } from "./config/redis";
import { db } from "./config/db";
import routes from "./routes/routes"
import { errorHandler } from "./middlewares/errorHandler";
import { AppEnv } from "./config/env";


const app = express();

const allowedOrigins = (AppEnv.ALLOWED_ORIGINS ?? "").split(",").map((origin) => origin.trim()).filter(Boolean);
app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : false }));
app.use(helmet());
app.use("/api/v1/payments/paystack/webhook", express.raw({ type: "application/json" }));
app.use(express.json());

app.use('/api/v1', routes)

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Server is healthy' });
});

app.get("/health/redis", async (_req, res, next) => {
  try {
    const result = await redis.ping();

    res.status(200).json({
      status: "OK",
      redis: result,
    });
  } catch (error) {
    next(error);
  }
});

app.get("/health/ready", async (_req, res, next) => {
  try {
    await Promise.all([redis.ping(), db.raw("select 1")]);
    res.status(200).json({ status: "OK", database: "ready", redis: "ready" });
  } catch (error) {
    next(error);
  }
});

app.use(errorHandler);

export default app;
