import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

// Parse CLOUDINARY_URL from environment
// Format: cloudinary://api_key:api_secret@cloud_name
const cloudinaryUrl = process.env.CLOUDINARY_URL;

if (!cloudinaryUrl) {
    console.warn('⚠️  CLOUDINARY_URL not configured. File uploads will fail.');
} else {
    // Cloudinary automatically configures itself from CLOUDINARY_URL
    // No need for manual config.api_key, config.api_secret, config.cloud_name
    console.log('✅ Cloudinary configured successfully');
}

export interface CloudinaryUploadResult {
    public_id: string;
    secure_url: string;
    format: string;
    resource_type: string;
    bytes: number;
    width?: number;
    height?: number;
}

/**
 * Upload file buffer to Cloudinary
 */
export const uploadToCloudinary = async (
    fileBuffer: Buffer,
    options: {
        folder?: string;
        resourceType?: 'image' | 'video' | 'raw' | 'auto';
        publicId?: string;
    } = {}
): Promise<CloudinaryUploadResult> => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: options.folder || 'project-files',
                resource_type: options.resourceType || 'auto',
                public_id: options.publicId,
            },
            (error: any, result: any) => {
                if (error) return reject(error);
                if (!result) return reject(new Error('Upload failed - no result'));

                resolve({
                    public_id: result.public_id,
                    secure_url: result.secure_url,
                    format: result.format,
                    resource_type: result.resource_type,
                    bytes: result.bytes,
                    width: result.width,
                    height: result.height,
                });
            }
        );

        const readableStream = Readable.from(fileBuffer);
        readableStream.pipe(uploadStream);
    });
};

/**
 * Delete file from Cloudinary
 */
export const deleteFromCloudinary = async (
    publicId: string,
    resourceType: 'image' | 'video' | 'raw' = 'raw'
): Promise<void> => {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

/**
 * Get optimized URL for image with transformations
 */
export const getOptimizedImageUrl = (
    publicId: string,
    options: {
        width?: number;
        height?: number;
        crop?: string;
        quality?: string | number;
    } = {}
): string => {
    return cloudinary.url(publicId, {
        transformation: [
            {
                width: options.width,
                height: options.height,
                crop: options.crop || 'limit',
                quality: options.quality || 'auto',
                fetch_format: 'auto',
            },
        ],
    });
};

export default cloudinary;
