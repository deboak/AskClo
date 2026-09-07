import type { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../utils/response";
import { GarmentService, garmentService } from "./garment.service";

export class GarmentController {
  constructor(private readonly service: GarmentService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const garments = await this.service.list(req.user.sub);
      sendSuccess(res, garments, { message: "Garments retrieved successfully" });
    } catch (error) {
      next(error);
    }
  };

  upload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const contentType = String(req.headers["content-type"] ?? "").split(";", 1)[0].trim().toLowerCase();
      const garment = await this.service.upload(req.user.sub, req.body as Buffer, contentType);
      sendSuccess(res, garment, { statusCode: 201, message: "Garment uploaded successfully" });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const garment = await this.service.update(req.user.sub, String(req.params.garmentId), req.body);
      sendSuccess(res, garment, { message: "Garment updated successfully" });
    } catch (error) {
      next(error);
    }
  };
}

export const garmentController = new GarmentController(garmentService);
