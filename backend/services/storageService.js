const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');

const localUploadsDir = path.resolve(__dirname, '..', 'uploads');
if (!fs.existsSync(localUploadsDir)) {
  try {
    fs.mkdirSync(localUploadsDir, { recursive: true });
  } catch (err) {
    // Read-only filesystem in some serverless environments
  }
}

/**
 * Uploads a file buffer either to Cloudinary (in production/when configured)
 * or to local disk (in development).
 *
 * @param {Object} file - Multer file object (with buffer or path)
 * @returns {Promise<{
 *   stored_file_name: string,
 *   file_path: string,
 *   storage_type: 'cloudinary' | 'local',
 *   file_size: number,
 *   file_type: string
 * }>}
 */
async function uploadFile(file) {
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const cleanBaseName = path.basename(file.originalname, path.extname(file.originalname))
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 40);
  const randomHex = crypto.randomBytes(8).toString('hex');
  const safeStoredName = `${cleanBaseName}_${Date.now()}_${randomHex}.${ext}`;

  // 1. Production Cloudinary Storage Path
  if (isCloudinaryConfigured()) {
    return new Promise((resolve, reject) => {
      // Cloudinary resource_type: 'auto' handles PDFs, DOCs, PPTs automatically
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'shelfshare_academic_resources',
          public_id: `${cleanBaseName}_${Date.now()}_${randomHex}`,
          resource_type: 'auto',
          use_filename: true,
        },
        (error, result) => {
          if (error) {
            console.error('[Cloudinary Upload Error]', error);
            return reject(new Error(`Cloud storage upload failed: ${error.message}`));
          }
          return resolve({
            stored_file_name: result.public_id,
            file_path: result.secure_url,
            storage_type: 'cloudinary',
            file_size: result.bytes || file.size,
            file_type: ext,
          });
        }
      );

      // Write file buffer to upload stream
      if (file.buffer) {
        uploadStream.end(file.buffer);
      } else if (file.path && fs.existsSync(file.path)) {
        fs.createReadStream(file.path).pipe(uploadStream);
      } else {
        return reject(new Error('Invalid file payload: No file content available.'));
      }
    });
  }

  // 2. Vercel Serverless without Cloudinary Guard
  const isVercel = Boolean(process.env.VERCEL);
  if (isVercel) {
    throw new Error(
      'Cloud storage is not configured on Vercel. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your Vercel Project Environment Variables to enable permanent document storage.'
    );
  }

  // 3. Local Development Disk Fallback
  const targetPath = path.resolve(localUploadsDir, safeStoredName);
  if (file.buffer) {
    fs.writeFileSync(targetPath, file.buffer);
  } else if (file.path && file.path !== targetPath) {
    fs.copyFileSync(file.path, targetPath);
  }

  return {
    stored_file_name: safeStoredName,
    file_path: `uploads/${safeStoredName}`,
    storage_type: 'local',
    file_size: file.size,
    file_type: ext,
  };
}

/**
 * Deletes a file either from Cloudinary or local disk
 *
 * @param {string} storedFileName
 * @param {string} filePath
 */
async function deleteFile(storedFileName, filePath) {
  try {
    if (filePath && filePath.startsWith('http')) {
      // Cloudinary file
      if (isCloudinaryConfigured()) {
        try {
          await cloudinary.uploader.destroy(storedFileName, { resource_type: 'raw' });
        } catch (e) {
          // Attempt image resource_type if raw wasn't matched
          await cloudinary.uploader.destroy(storedFileName, { resource_type: 'image' });
        }
      }
      return;
    }

    // Local file
    const localTarget = path.resolve(localUploadsDir, storedFileName);
    if (fs.existsSync(localTarget)) {
      fs.unlinkSync(localTarget);
    }
  } catch (error) {
    console.error('[Storage Delete Error]', error.message);
  }
}

module.exports = {
  uploadFile,
  deleteFile,
};
