const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');

dotenv.config();

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

const isConfigured = Boolean(cloudName && apiKey && apiSecret);

if (isConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  console.log(`[Storage] Cloudinary initialized for cloud: ${cloudName}`);
} else {
  console.log('[Storage] Cloudinary credentials not detected; local disk fallback active.');
}

function isCloudinaryConfigured() {
  return isConfigured;
}

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
};
