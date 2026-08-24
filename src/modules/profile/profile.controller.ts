import type { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../utils/response";
import { AppError } from "../../utils/appError";
import { profileService } from "./profile.service";

export const profileController = {
  get: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const profile = await profileService.getProfile(req.user.sub);
      if (!profile) throw new AppError(404, "Profile not found");
      sendSuccess(res, profile);
    } catch (error) {
      next(error);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(res, await profileService.updateProfile(req.user.sub, req.body), {
        message: "Profile updated successfully",
      });
    } catch (error) {
      next(error);
    }
  },

  uploadPhoto: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const contentType = String(req.headers["content-type"] ?? "").split(";", 1)[0].trim().toLowerCase();
      const result = await profileService.uploadPhoto(req.user.sub, req.body as Buffer, contentType);
      sendSuccess(res, result, { message: "Profile photo uploaded successfully" });
    } catch (error) {
      next(error);
    }
  },
};
