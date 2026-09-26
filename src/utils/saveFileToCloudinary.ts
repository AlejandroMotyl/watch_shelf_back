import 'dotenv/config';
import { Readable } from 'node:stream';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';

cloudinary.config({
  secure: true,
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function saveFileToCloudinary(
  buffer: Buffer,
): Promise<UploadApiResponse> {
  return new Promise<UploadApiResponse>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'watch_shelf/avatars',
        resource_type: 'image',
        overwrite: true,
        unique_filename: true,
        use_filename: false,
      },
      (err, result) => {
        if (err) {
          reject(err);
          return;
        }

        if (!result) {
          reject(new Error('Cloudinary upload returned no result'));
          return;
        }

        resolve(result);
      },
    );

    Readable.from(buffer).pipe(uploadStream);
  });
}
export async function deleteFileFromCloudinary(
  publicId: string,
): Promise<void> {
  await cloudinary.uploader.destroy(publicId, {
    resource_type: 'image',
  });
}
