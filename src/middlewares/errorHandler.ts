import type { ErrorRequestHandler } from "express";
import { AppError } from "../utils/appError.js";

export const errorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next,
) => {
  if (error instanceof AppError) {
    console.warn(`[${error.statusCode}] ${error.message}`);
    res.status(error.statusCode).json({
      status: "error",
      message: error.message,
    });
    return;
  }

  console.error("Unexpected server error:", error instanceof Error ? error.message : error);
  const status = 500;
  const message = process.env.NODE_ENV === "production" 
  ? "Something went wrong. Please try again"
  : error.message;
  res.status(status).json({status: "error", message: message});
};
