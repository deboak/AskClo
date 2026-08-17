import type { ErrorRequestHandler } from "express";
import { AppError } from "../utils/app-error.js";

export const errorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next,
) => {
  console.error(error);

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      status: "error",
      message: error.message,
    });
    return;
  }

  const status = 500;
  const message = process.env.NODE_ENV === "production" 
  ? "Something went wrong. Pkease try again"
  : error.message;
  res.status(status).json({status: "error", message: message});
};