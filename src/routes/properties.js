const express = require('express');
const Joi = require('joi');
const Property = require('../models/Property');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const propertySchema = Joi.object({
  title: Joi.string().min(5).max(200).required(),
  description: Joi.string().max(2000),
  price: Joi.number().min(0).required(),
  beds: Joi.number().min(0).max(20).required(),
  baths: Joi.number().min(0).max(20).required(),
  sqft: Joi.number().min(1).required(),
  address: Joi.string().min(10).max(500).required(),
  lat: Joi.number().min(-90).max(90),
  lng: Joi.number().min(-180).max(180),
  propertyType: Joi.string().valid('house', 'apartment', 'condo', 'villa', 'townhouse', 'studio', 'other').required(),
  status: Joi.string().valid('for_sale', 'for_rent', 'sold', 'rented', 'off_market'),
  publish_status: Joi.string().valid('draft', 'published', 'archived', 'pending_review'),
  listing_type: Joi.string().valid('sale', 'rent', 'both'),
  images: Joi.array().items(Joi.string().uri()),
  yearBuilt: Joi.number().min(1800).max(new Date().getFullYear() + 5),
  lotSize: Joi.number().min(0),
  features: Joi.array().items(Joi.string()),
  contact_info: Joi.object({
    phone: Joi.string(),
    email: Joi.string().email(),
    agent_name: Joi.string()
  })
});

// @route   POST /properties
// @desc    Create new property
// @access  Private
router.post('/', protect, async (req, res, next) => {
  try {
    // Handle both JSON and form data with credentials
    let propertyData;

    if (req.body.username && req.body.password) {
      // This is a request with embedded credentials (like from frontend)
      const { username, password, ...data } = req.body;
      propertyData = data;
    } else {
      propertyData = req.body;
    }

    // Validate input
    const { error, value } = propertySchema.validate(propertyData);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    // Set default coordinates if not provided
    if (!value.lat || !value.lng) {
      // Default to Addis Ababa coordinates
      value.lat = 9.0320;
      value.lng = 38.7469;
    }

    // Create property with current user as owner
    const property = await Property.create({
      ...value,
      owner: req.user._id
    });

    // Populate owner info
    await property.populate('owner', 'first_name last_name email phone');

    res.status(201).json({
      success: true,
      data: property
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /properties
// @desc    Get all properties with filters
// @access  Public
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const {
      search,
      type,
      min_price,
      max_price,
      bedroom,
      bathroom,
      status,
      page = 1,
      limit = 20,
      sort = '-created_at'
    } = req.query;

    // Build filters
    const filters = {};

    if (search) filters.search = search;
    if (type) filters.type = Array.isArray(type) ? type : [type];
    if (min_price) filters.min_price = parseFloat(min_price);
    if (max_price) filters.max_price = parseFloat(max_price);
    if (bedroom) filters.bedroom = parseInt(bedroom);
    if (bathroom) filters.bathroom = parseInt(bathroom);
    if (status) filters.status = status;

    // Get properties with filters
    let query = Property.searchProperties(filters);

    // Apply pagination and sorting
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const properties = await query
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Property.countDocuments(
      Property.searchProperties(filters).getQuery()
    );

    res.json({
      success: true,
      data: properties,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /properties (with credentials)
// @desc    Get properties with embedded credentials (for frontend compatibility)
// @access  Public
router.post('/list', async (req, res, next) => {
  try {
    // Handle request with embedded credentials
    const { username, password, ...filters } = req.body;

    // For now, just return properties (authentication handled separately)
    let query = Property.searchProperties(filters);

    const properties = await query
      .sort('-created_at')
      .limit(50)
      .populate('owner', 'first_name last_name email phone');

    res.json(properties);
  } catch (error) {
    next(error);
  }
});

// @route   GET /properties/:id
// @desc    Get single property
// @access  Public
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate('owner', 'first_name last_name email phone');

    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }

    // Increment views if not owner
    if (!req.user || property.owner._id.toString() !== req.user._id.toString()) {
      await property.incrementViews();
    }

    res.json({
      success: true,
      data: property
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /properties/:id
// @desc    Update property
// @access  Private (Owner or Admin)
router.put('/:id', protect, async (req, res, next) => {
  try {
    let property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }

    // Check ownership or admin role
    if (property.owner.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this property'
      });
    }

    // Validate input
    const { error, value } = propertySchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    property = await Property.findByIdAndUpdate(
      req.params.id,
      value,
      { new: true, runValidators: true }
    ).populate('owner', 'first_name last_name email phone');

    res.json({
      success: true,
      data: property
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /properties/:id
// @desc    Delete property
// @access  Private (Owner or Admin)
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }

    // Check ownership or admin role
    if (property.owner.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this property'
      });
    }

    await Property.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Property deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /properties/nearby
// @desc    Get nearby properties
// @access  Public
router.get('/nearby', optionalAuth, async (req, res, next) => {
  try {
    const { lat, lng, radius = 5 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }

    const properties = await Property.findNearby(
      parseFloat(lat),
      parseFloat(lng),
      parseFloat(radius)
    );

    res.json({
      success: true,
      data: properties
    });
  } catch (error) {
    next(error);
  }
});

// @route   PATCH /properties/:id/status
// @desc    Toggle property status
// @access  Private (Owner or Admin)
router.patch('/:id/status', protect, async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }

    // Check ownership or admin role
    if (property.owner.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this property'
      });
    }

    // Toggle status logic
    let newStatus;
    if (property.status === 'for_sale') {
      newStatus = 'sold';
    } else if (property.status === 'for_rent') {
      newStatus = 'rented';
    } else if (property.status === 'sold') {
      newStatus = 'for_sale';
    } else if (property.status === 'rented') {
      newStatus = 'for_rent';
    } else {
      newStatus = 'for_sale';
    }

    property.status = newStatus;
    await property.save();
    await property.populate('owner', 'first_name last_name email phone');

    res.json({
      success: true,
      data: property
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /properties/stats/breakdown
// @desc    Get property statistics
// @access  Private/Admin
router.get('/stats/breakdown', protect, authorize('ADMIN'), async (req, res, next) => {
  try {
    const stats = await Property.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' }
        }
      }
    ]);

    const typeStats = await Property.aggregate([
      {
        $group: {
          _id: '$propertyType',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        statusBreakdown: stats,
        typeBreakdown: typeStats
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /properties/stats/monthly
// @desc    Get monthly property data
// @access  Private/Admin
router.get('/stats/monthly', protect, authorize('ADMIN'), async (req, res, next) => {
  try {
    const monthlyStats = await Property.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$created_at' },
            month: { $month: '$created_at' }
          },
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' }
        }
      },
      {
        $sort: { '_id.year': -1, '_id.month': -1 }
      },
      {
        $limit: 12
      }
    ]);

    res.json({
      success: true,
      data: monthlyStats
    });
  } catch (error) {
    next(error);
  }
});

// @route   PATCH /properties/:id/publish
// @desc    Publish a property
// @access  Private (Owner or Admin)
router.patch('/:id/publish', protect, async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }

    // Check ownership or admin role
    if (property.owner.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to publish this property'
      });
    }

    await property.publish();
    await property.populate('owner', 'first_name last_name email phone');

    res.json({
      success: true,
      message: 'Property published successfully',
      data: property
    });
  } catch (error) {
    next(error);
  }
});

// @route   PATCH /properties/:id/archive
// @desc    Archive a property
// @access  Private (Owner or Admin)
router.patch('/:id/archive', protect, async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }

    // Check ownership or admin role
    if (property.owner.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to archive this property'
      });
    }

    await property.archive();
    await property.populate('owner', 'first_name last_name email phone');

    res.json({
      success: true,
      message: 'Property archived successfully',
      data: property
    });
  } catch (error) {
    next(error);
  }
});

// @route   PATCH /properties/:id/draft
// @desc    Set property as draft
// @access  Private (Owner or Admin)
router.patch('/:id/draft', protect, async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }

    // Check ownership or admin role
    if (property.owner.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to modify this property'
      });
    }

    await property.setAsDraft();
    await property.populate('owner', 'first_name last_name email phone');

    res.json({
      success: true,
      message: 'Property set as draft successfully',
      data: property
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /properties/my-properties
// @desc    Get current user's properties
// @access  Private
router.get('/my-properties', protect, async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      publish_status,
      status
    } = req.query;

    // Build query for user's properties
    const query = { owner: req.user._id };

    if (publish_status) query.publish_status = publish_status;
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const properties = await Property.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('owner', 'first_name last_name email phone');

    const total = await Property.countDocuments(query);

    res.json({
      success: true,
      data: properties,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
