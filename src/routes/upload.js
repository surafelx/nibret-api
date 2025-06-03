const express = require('express');
const router = express.Router();
const { upload, uploadToCloudinary, deleteFromCloudinary, getImageUrls } = require('../config/cloudinary');
const { protect } = require('../middleware/auth');
const { trackActivity } = require('../middleware/activity');
const path = require('path');

// @route   POST /upload/image
// @desc    Upload single image (Cloudinary or local storage)
// @access  Private
router.post('/image', protect, upload.single('image'), trackActivity('image_upload', 'Single image uploaded'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    let result;

    // Check if using Cloudinary or local storage
    if (req.file.path && req.file.path.includes('cloudinary')) {
      // Cloudinary upload
      result = {
        public_id: req.file.filename,
        secure_url: req.file.path,
        width: req.file.width || null,
        height: req.file.height || null,
        format: req.file.format || null,
        bytes: req.file.size || null,
        urls: getImageUrls(req.file.filename)
      };
    } else {
      // Local storage fallback
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;

      result = {
        public_id: req.file.filename,
        secure_url: imageUrl,
        width: null,
        height: null,
        format: path.extname(req.file.filename).substring(1),
        bytes: req.file.size || null,
        urls: {
          original: imageUrl,
          thumbnail: imageUrl,
          medium: imageUrl,
          large: imageUrl,
          hero: imageUrl
        }
      };
    }

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    next(error);
  }
});

// @route   POST /upload/images
// @desc    Upload multiple images to Cloudinary
// @access  Private
router.post('/images', protect, upload.array('images', 10), trackActivity('image_upload', 'Multiple images uploaded'), async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No image files provided'
      });
    }

    // Files are already uploaded to Cloudinary via multer middleware
    const results = req.files.map(file => ({
      public_id: file.filename,
      secure_url: file.path,
      width: file.width || null,
      height: file.height || null,
      format: file.format || null,
      bytes: file.size || null,
      urls: getImageUrls(file.filename)
    }));

    res.status(200).json({
      success: true,
      data: results,
      count: results.length
    });

  } catch (error) {
    next(error);
  }
});

// @route   POST /upload/base64
// @desc    Upload base64 image to Cloudinary
// @access  Private
router.post('/base64', protect, trackActivity('image_upload', 'Base64 image uploaded'), async (req, res, next) => {
  try {
    const { image, filename } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        error: 'No base64 image data provided'
      });
    }

    // Upload base64 image to Cloudinary
    const result = await uploadToCloudinary(image, {
      public_id: filename ? `property-${Date.now()}-${filename}` : undefined,
      folder: 'nibret-properties'
    });

    const response = {
      public_id: result.public_id,
      secure_url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
      urls: getImageUrls(result.public_id)
    };

    res.status(200).json({
      success: true,
      data: response
    });

  } catch (error) {
    next(error);
  }
});

// @route   DELETE /upload/delete
// @desc    Delete image from Cloudinary
// @access  Private
router.delete('/delete', protect, trackActivity('image_delete', 'Image deleted'), async (req, res, next) => {
  try {
    const { public_id } = req.body;

    if (!public_id) {
      return res.status(400).json({
        success: false,
        error: 'Public ID is required'
      });
    }

    // Delete image from Cloudinary
    const result = await deleteFromCloudinary(public_id);

    if (result.result === 'ok') {
      res.status(200).json({
        success: true,
        message: 'Image deleted successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to delete image'
      });
    }

  } catch (error) {
    next(error);
  }
});

// @route   POST /upload/url
// @desc    Upload image from URL to Cloudinary
// @access  Private
router.post('/url', protect, trackActivity('image_upload', 'Image uploaded from URL'), async (req, res, next) => {
  try {
    const { url, filename } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'Image URL is required'
      });
    }

    // Upload image from URL to Cloudinary
    const result = await uploadToCloudinary(url, {
      public_id: filename ? `property-${Date.now()}-${filename}` : undefined,
      folder: 'nibret-properties'
    });

    const response = {
      public_id: result.public_id,
      secure_url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
      urls: getImageUrls(result.public_id)
    };

    res.status(200).json({
      success: true,
      data: response
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /upload/info/:public_id
// @desc    Get image information from Cloudinary
// @access  Private
router.get('/info/:public_id', protect, async (req, res, next) => {
  try {
    const { public_id } = req.params;

    // Get image URLs for different sizes
    const urls = getImageUrls(public_id);

    res.status(200).json({
      success: true,
      data: {
        public_id,
        urls
      }
    });

  } catch (error) {
    next(error);
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: 'File size too large. Maximum size is 10MB.'
    });
  }

  if (error.message === 'Only image files are allowed!') {
    return res.status(400).json({
      success: false,
      error: 'Only image files are allowed'
    });
  }

  next(error);
});

module.exports = router;
