const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Check if Cloudinary is properly configured
const isCloudinaryConfigured = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  return cloudName &&
         apiKey &&
         apiSecret &&
         cloudName !== 'your-cloud-name' &&
         apiKey !== 'your-api-key' &&
         apiSecret !== 'your-api-secret' &&
         apiSecret !== 'REPLACE_WITH_YOUR_REAL_API_SECRET';
};

// Configure Cloudinary - ALWAYS required for production
if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('✅ Cloudinary configured successfully');
} else {
  console.error('❌ Cloudinary configuration missing! Image uploads will fail.');
  console.error('Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.');
  throw new Error('Cloudinary configuration is required for image uploads');
}

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Always use Cloudinary storage - no fallback to local storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'nibret-properties',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [
      {
        width: 1200,
        height: 800,
        crop: 'limit',
        quality: 'auto:good',
        fetch_format: 'auto'
      }
    ],
    public_id: (req, file) => {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 15);
      return `property-${timestamp}-${random}`;
    },
  },
});

// Configure multer with Cloudinary storage
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
});

// Helper functions
const uploadToCloudinary = async (file, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder: 'nibret-properties',
      transformation: [
        {
          width: 1200,
          height: 800,
          crop: 'limit',
          quality: 'auto:good',
          fetch_format: 'auto'
        }
      ],
      ...options
    });
    return result;
  } catch (error) {
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw new Error(`Cloudinary delete failed: ${error.message}`);
  }
};

const generateImageUrl = (publicId, transformations = {}) => {
  return cloudinary.url(publicId, {
    secure: true,
    ...transformations
  });
};

// Predefined transformations for different use cases
const transformations = {
  thumbnail: {
    width: 300,
    height: 200,
    crop: 'fill',
    gravity: 'center',
    quality: 'auto:good'
  },
  medium: {
    width: 600,
    height: 400,
    crop: 'fill',
    gravity: 'center',
    quality: 'auto:good'
  },
  large: {
    width: 1200,
    height: 800,
    crop: 'limit',
    quality: 'auto:good'
  },
  hero: {
    width: 1920,
    height: 1080,
    crop: 'fill',
    gravity: 'center',
    quality: 'auto:best'
  }
};

const getImageUrls = (publicId) => {
  return {
    original: generateImageUrl(publicId),
    thumbnail: generateImageUrl(publicId, transformations.thumbnail),
    medium: generateImageUrl(publicId, transformations.medium),
    large: generateImageUrl(publicId, transformations.large),
    hero: generateImageUrl(publicId, transformations.hero)
  };
};

module.exports = {
  cloudinary,
  upload,
  uploadToCloudinary,
  deleteFromCloudinary,
  generateImageUrl,
  getImageUrls,
  transformations
};
