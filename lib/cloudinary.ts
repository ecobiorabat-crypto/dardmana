import { v2 as cloudinary, type UploadApiResponse, type UploadApiErrorResponse } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export { cloudinary }

export async function uploadImage(
  file: string,
  folder: string
): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      file,
      {
        folder: `dar-dmana/${folder}`,
        quality: 'auto',
        fetch_format: 'auto',
      },
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error) reject(error)
        else if (result) resolve(result)
        else reject(new Error('No result from Cloudinary'))
      }
    )
  })
}

/** Upload binaire (API route admin) — secrets Cloudinary restent côté serveur. */
export async function uploadImageBuffer(
  buffer: Buffer,
  folder: string,
): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `dar-dmana/${folder}`,
        quality: 'auto',
        fetch_format: 'auto',
        resource_type: 'image',
      },
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error) reject(error)
        else if (result) resolve(result)
        else reject(new Error('No result from Cloudinary'))
      },
    )
    stream.end(buffer)
  })
}

/** Upload binaire média (image OU vidéo) — resource_type auto. Usage public (Livre d'Or). */
export async function uploadMediaBuffer(
  buffer: Buffer,
  folder: string,
): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `dar-dmana/${folder}`,
        quality: 'auto',
        fetch_format: 'auto',
        resource_type: 'auto',
      },
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error) reject(error)
        else if (result) resolve(result)
        else reject(new Error('No result from Cloudinary'))
      },
    )
    stream.end(buffer)
  })
}

export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId)
}

export function getOptimizedUrl(publicId: string, width = 800): string {
  return cloudinary.url(publicId, {
    width,
    crop: 'fill',
    quality: 'auto',
    fetch_format: 'auto',
  })
}
