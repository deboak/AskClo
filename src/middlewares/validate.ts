import { NextFunction, Request, Response } from 'express';
import { ZodObject, ZodRawShape } from 'zod';
import { sendError } from '../utils/response';

type RequestSchema = ZodObject<{
  body?: ZodObject<ZodRawShape>;
  params?: ZodObject<ZodRawShape>;
  query?: ZodObject<ZodRawShape>;
}>;

export function validate(schema: RequestSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      }));
      sendError(res, 'Validation error', { statusCode: 400, details });
      return;
    }

    if (result.data.body) req.body = result.data.body;
    if (result.data.params) req.params = result.data.params as Record<string, string>;
    if (result.data.query) {
      const queryTarget = req.query as Record<string, unknown>;
      for (const key of Object.keys(queryTarget)) {
        delete queryTarget[key];
      }
      Object.assign(queryTarget, result.data.query as Record<string, unknown>);
    }

    next();
  };
}
