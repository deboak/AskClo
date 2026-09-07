import { randomUUID } from "crypto";
import { GarmentModel } from "../../db/models/Garment";
import { garmentRepository } from "../../db/repositories/GarmentRepository";
import { AppError } from "../../utils/appError";
import { assertImageSignature, uploadImageToR2 } from "../../utils/r2";

export class GarmentService {
  async upload(userId: string, image: Buffer, contentType: string): Promise<GarmentModel> {
    if (!Buffer.isBuffer(image) || image.length === 0 || !contentType.startsWith("image/")) {
      throw new AppError(400, "A valid garment image is required");
    }
    assertImageSignature(image, contentType);
    const extension = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
    const imageUrl = await uploadImageToR2(`garments/${userId}/${randomUUID()}.${extension}`, image, contentType);
    return garmentRepository.create({ user_id: userId, image_url: imageUrl });
  }
  async list(userId: string) { return garmentRepository.findAllByUserId(userId); }
  async update(
    userId: string,
    garmentId: string,
    data: Partial<Pick<GarmentModel, "name" | "category" | "colour">>,
  ) {
    const garment = await garmentRepository.findByIdAndUserId(garmentId, userId);
    if (!garment) throw new AppError(404, "Garment not found");
    return garmentRepository.updateById(garment.id, data);
  }
}
export const garmentService = new GarmentService();
