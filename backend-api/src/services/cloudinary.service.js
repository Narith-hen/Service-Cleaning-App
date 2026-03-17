const { v2: cloudinary } = require('cloudinary');
const fs = require('fs');

let configured = false;

const isValidCredential = (value) => {
  return value && value !== '' && !value.startsWith('your_') && !value.includes('change-in-production');
};

const ensureConfigured = () => {
  if (configured) return true;
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  
  // Validate that credentials are not placeholder values
  if (!isValidCredential(CLOUDINARY_CLOUD_NAME) || 
      !isValidCredential(CLOUDINARY_API_KEY) || 
      !isValidCredential(CLOUDINARY_API_SECRET)) {
    console.warn('[Cloudinary] Credentials not configured or using placeholder values. Using local storage fallback.');
    return false;
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
  });
  configured = true;
  return true;
};

const uploadChatImage = async (filePath) => {
  if (!ensureConfigured()) return null;

  const result = await cloudinary.uploader.upload(filePath, {
    folder: 'service-cleaning/chat',
    resource_type: 'image'
  });

  try {
    fs.unlinkSync(filePath);
  } catch {
    // Ignore cleanup failures
  }

  return {
    url: result.secure_url || result.url,
    publicId: result.public_id
  };
};

module.exports = {
  uploadChatImage,
  ensureConfigured
};
