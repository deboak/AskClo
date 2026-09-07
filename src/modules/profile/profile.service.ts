import { randomUUID } from "crypto";
import { profileRepository } from "../../db/repositories/ProfileRepository";
import type { ProfileModel } from "../../db/models/Profiles";
import { AppError } from "../../utils/appError";
import { assertImageSignature, uploadImageToR2 } from "../../utils/r2";

export class ProfileService {
  async getProfile(userId: string): Promise<ProfileModel | undefined> {
    return profileRepository.findByUserId(userId);
  }

  async updateProfile(
    userId: string,
    data: Partial<Pick<ProfileModel, "gender" | "date_of_birth" | "style_preference" | "body_type" | "age" | "cultural_preference">>,
  ): Promise<ProfileModel> {
    const profile = await profileRepository.findByUserId(userId);
    if (profile) return profileRepository.updateById(profile.id, data);
    return profileRepository.create({ user_id: userId, ...data });
  }

  async uploadPhoto(userId: string, image: Buffer, contentType: string): Promise<{ photoUrl: string }> {
    if (!Buffer.isBuffer(image) || !image.length) {
      throw new AppError(400, "An image file is required");
    }
    if (!contentType.startsWith("image/")) throw new AppError(400, "Profile photo must be an image");
    assertImageSignature(image, contentType);
    const extension = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
    const photoUrl = await uploadImageToR2(`profile-photos/${userId}/${randomUUID()}.${extension}`, image, contentType);

    const profile = await profileRepository.findByUserId(userId);
    if (profile) await profileRepository.updateById(profile.id, { photo_url: photoUrl });
    else await profileRepository.create({ user_id: userId, photo_url: photoUrl });
    return { photoUrl };
  }
}

export const profileService = new ProfileService();
