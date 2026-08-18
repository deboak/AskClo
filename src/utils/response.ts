import { Response } from 'express';

interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

interface ErrorResponse {
  success: false;
  error: string;
  details?: unknown;
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  options?: { statusCode?: number; message?: string },
): void => {
  const body: SuccessResponse<T> = { success: true, data };
  if (options?.message) body.message = options.message;
  res.status(options?.statusCode ?? 200).json(body);
};

export const sendError = (
  res: Response,
  error: string,
  options?: { statusCode?: number; details?: unknown },
): void => {
  const body: ErrorResponse = { success: false, error };
  if (options?.details !== undefined) body.details = options.details;
  res.status(options?.statusCode ?? 500).json(body);
};
