import type { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../utils/response";
import { generationService } from "./generation.service";

export const generationController = {
  request: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const generation = await generationService.requestGeneration(req.user.sub, req.body);
      sendSuccess(res, generation, { statusCode: 202, message: "Try-on generation queued" });
    } catch (error) {
      next(error);
    }
  },
  get: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { sendSuccess(res, await generationService.getGeneration(req.user.sub, String(req.params.generationId))); } catch (error) { next(error); }
  },
  list: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { sendSuccess(res, await generationService.listGenerations(req.user.sub)); } catch (error) { next(error); }
  },
};
