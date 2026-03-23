const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadRoot = path.join(__dirname, '../../uploads');

// Ensure upload directories exist
const createUploadDirs = () => {
  const dirs = [
    path.join(uploadRoot, 'avatars'),
    path.join(uploadRoot, 'services'),
    path.join(uploadRoot, 'bookings'),
    path.join(uploadRoot, 'misc')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadDirs();

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = uploadRoot;
    
    if (file.fieldname === 'avatar') {
      uploadPath = path.join(uploadPath, 'avatars');
    } else if (file.fieldname === 'images' && req.originalUrl.includes('/bookings/')) {
      uploadPath = path.join(uploadPath, 'bookings');
    } else if (file.fieldname === 'images') {
      uploadPath = path.join(uploadPath, 'services');
    } else {
      uploadPath = path.join(uploadPath, 'misc');
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase();
  const mimeType = String(file.mimetype || '').toLowerCase();
  const imageExtensions = new Set([
    '.jpeg',
    '.jpg',
    '.png',
    '.gif',
    '.webp',
    '.heic',
    '.heif',
    '.avif',
    '.bmp',
    '.jfif',
    '.svg',
    '.tif',
    '.tiff'
  ]);
  const imageMimePrefix = 'image/';
  const hasImageExtension = imageExtensions.has(extension);
  const hasImageMimeType = mimeType.startsWith(imageMimePrefix);

  if (file.fieldname === 'receipt') {
    const isPdf = extension === '.pdf' && mimeType === 'application/pdf';
    const isImage = hasImageExtension || hasImageMimeType;
    if (isPdf || isImage) {
      return cb(null, true);
    }
    return cb(new Error('Receipt must be an image or PDF'));
  }

  const isImage = hasImageExtension || hasImageMimeType;
  if (isImage) {
    return cb(null, true);
  }
  return cb(new Error('Only image files are allowed'));
};

// Create multer instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

module.exports = { upload };
