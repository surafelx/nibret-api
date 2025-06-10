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
  currency: Joi.string().valid('ETB', 'USD').default('ETB'),
  beds: Joi.number().min(0).max(20).required(),
  baths: Joi.number().min(0).max(20).required(),
  sqft: Joi.number().min(1).required(),
  address: Joi.string().min(5).max(500).required(),
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
    phone: Joi.string().allow('').optional(),
    email: Joi.string().email().allow('').optional(),
    agent_name: Joi.string().allow('').optional()
  }).optional()
});

// @route   POST /properties
// @desc    Create new property (with embedded credentials support)
// @access  Private/Public with credentials
router.post('/', async (req, res, next) => {
  try {
    let propertyData;
    let user = null;

    if (req.body.username && req.body.password) {
      // This is a request with embedded credentials (like from frontend)
      const { username, password, ...data } = req.body;
      propertyData = data;

      // Authenticate user with embedded credentials
      const User = require('../models/User');
      user = await User.findByEmailOrPhone(username);

      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }
    } else if (req.user) {
      // This is a request with JWT token
      propertyData = req.body;
      user = req.user;
    } else {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Convert string numbers to actual numbers and handle empty values
    if (propertyData.price !== undefined) {
      if (typeof propertyData.price === 'string') {
        propertyData.price = parseFloat(propertyData.price);
      }
      if (isNaN(propertyData.price) || propertyData.price < 0) {
        return res.status(400).json({
          success: false,
          error: 'Price must be a valid number greater than or equal to 0'
        });
      }
    }

    if (propertyData.beds !== undefined) {
      if (typeof propertyData.beds === 'string') {
        propertyData.beds = parseInt(propertyData.beds);
      }
      if (isNaN(propertyData.beds) || propertyData.beds < 0 || propertyData.beds > 20) {
        return res.status(400).json({
          success: false,
          error: 'Bedrooms must be a valid number between 0 and 20'
        });
      }
    }

    if (propertyData.baths !== undefined) {
      if (typeof propertyData.baths === 'string') {
        propertyData.baths = parseInt(propertyData.baths);
      }
      if (isNaN(propertyData.baths) || propertyData.baths < 0 || propertyData.baths > 20) {
        return res.status(400).json({
          success: false,
          error: 'Bathrooms must be a valid number between 0 and 20'
        });
      }
    }

    if (propertyData.sqft !== undefined) {
      if (typeof propertyData.sqft === 'string') {
        propertyData.sqft = parseFloat(propertyData.sqft);
      }
      if (isNaN(propertyData.sqft) || propertyData.sqft < 1) {
        return res.status(400).json({
          success: false,
          error: 'Square footage must be a valid number greater than or equal to 1'
        });
      }
    }

    if (propertyData.lat !== undefined && propertyData.lat !== '') {
      if (typeof propertyData.lat === 'string') {
        propertyData.lat = parseFloat(propertyData.lat);
      }
      if (isNaN(propertyData.lat)) {
        propertyData.lat = undefined; // Will use default
      }
    }

    if (propertyData.lng !== undefined && propertyData.lng !== '') {
      if (typeof propertyData.lng === 'string') {
        propertyData.lng = parseFloat(propertyData.lng);
      }
      if (isNaN(propertyData.lng)) {
        propertyData.lng = undefined; // Will use default
      }
    }

    if (propertyData.yearBuilt !== undefined && propertyData.yearBuilt !== '') {
      if (typeof propertyData.yearBuilt === 'string') {
        propertyData.yearBuilt = parseInt(propertyData.yearBuilt);
      }
      if (isNaN(propertyData.yearBuilt)) {
        propertyData.yearBuilt = undefined; // Optional field
      }
    }

    if (propertyData.lotSize !== undefined && propertyData.lotSize !== '') {
      if (typeof propertyData.lotSize === 'string') {
        propertyData.lotSize = parseFloat(propertyData.lotSize);
      }
      if (isNaN(propertyData.lotSize)) {
        propertyData.lotSize = undefined; // Optional field
      }
    }

    // Clean up contact_info - remove empty strings and convert to undefined
    if (propertyData.contact_info) {
      const contactInfo = propertyData.contact_info;

      // Convert empty strings to undefined for optional fields
      if (contactInfo.phone === '') contactInfo.phone = undefined;
      if (contactInfo.email === '') contactInfo.email = undefined;
      if (contactInfo.agent_name === '') contactInfo.agent_name = undefined;

      // If all contact info fields are empty, remove the entire object
      if (!contactInfo.phone && !contactInfo.email && !contactInfo.agent_name) {
        propertyData.contact_info = undefined;
      }
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

    // Set default values
    if (!value.status) value.status = 'for_sale';
    if (!value.publish_status) value.publish_status = 'draft';
    if (!value.listing_type) value.listing_type = 'sale';
    if (!value.currency) value.currency = 'ETB';

    // Create property with current user as owner
    const property = await Property.create({
      ...value,
      owner: user._id
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

    // For public listing, only show published properties
    const publicFilters = {
      ...filters,
      publish_status: 'published'
    };

    // Build query manually to include publish_status filter
    const query = {};

    // Text search
    if (publicFilters.search) {
      query.$text = { $search: publicFilters.search };
    }

    // Property type filter
    if (publicFilters.type && publicFilters.type.length > 0) {
      query.propertyType = { $in: publicFilters.type };
    }

    // Price range
    if (publicFilters.min_price || publicFilters.max_price) {
      query.price = {};
      if (publicFilters.min_price) query.price.$gte = publicFilters.min_price;
      if (publicFilters.max_price) query.price.$lte = publicFilters.max_price;
    }

    // Bedroom filter
    if (publicFilters.bedroom) {
      query.beds = { $gte: publicFilters.bedroom };
    }

    // Bathroom filter
    if (publicFilters.bathroom) {
      query.baths = { $gte: publicFilters.bathroom };
    }

    // Status filter - handle both status and listing_type
    if (publicFilters.status) {
      if (publicFilters.status === 'for_rent') {
        // For rent page: show properties that are for rent OR have listing_type 'rent' or 'both'
        query.$or = [
          { status: 'for_rent' },
          { listing_type: 'rent' },
          { listing_type: 'both' }
        ];
      } else if (publicFilters.status === 'for_sale') {
        // For sale page: show properties that are for sale OR have listing_type 'sale' or 'both'
        query.$or = [
          { status: 'for_sale' },
          { listing_type: 'sale' },
          { listing_type: 'both' }
        ];
      } else {
        // Other statuses: use exact match
        query.status = publicFilters.status;
      }
    }

    // Only published properties for public listing
    query.publish_status = 'published';

    // Get properties with featured properties first, then by creation date
    const properties = await Property.find(query)
      .sort({ is_featured: -1, created_at: -1 }) // Featured first, then newest
      .limit(50)
      .populate('owner', 'first_name last_name email phone');

    // Transform properties to ensure id field is present
    const transformedProperties = properties.map(property => {
      const propertyObj = property.toJSON();
      return propertyObj;
    });

    res.json(transformedProperties);
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

// @route   PATCH /properties/:id/feature
// @desc    Toggle featured status of a property (Admin only)
// @access  Private (Admin only)
router.patch('/:id/feature', protect, async (req, res, next) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Only admins can feature/unfeature properties'
      });
    }

    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }

    // Toggle featured status
    property.is_featured = !property.is_featured;
    await property.save();

    await property.populate('owner', 'first_name last_name email phone');

    res.json({
      success: true,
      message: `Property ${property.is_featured ? 'featured' : 'unfeatured'} successfully`,
      data: property,
      is_featured: property.is_featured
    });

  } catch (error) {
    next(error);
  }
});

// @route   POST /properties/bulk-feature
// @desc    Bulk toggle featured status for multiple properties (Admin only)
// @access  Private (Admin only)
router.post('/bulk-feature', protect, async (req, res, next) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Only admins can bulk feature properties'
      });
    }

    const { property_ids, is_featured } = req.body;

    if (!Array.isArray(property_ids) || property_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'property_ids must be a non-empty array'
      });
    }

    if (typeof is_featured !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'is_featured must be a boolean value'
      });
    }

    // Update multiple properties
    const result = await Property.updateMany(
      { _id: { $in: property_ids } },
      { is_featured: is_featured }
    );

    // Get updated properties
    const updatedProperties = await Property.find({ _id: { $in: property_ids } })
      .populate('owner', 'first_name last_name email phone');

    res.json({
      success: true,
      message: `${result.modifiedCount} properties ${is_featured ? 'featured' : 'unfeatured'} successfully`,
      data: updatedProperties,
      modified_count: result.modifiedCount
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /properties/featured
// @desc    Get all featured properties
// @access  Public
router.get('/featured', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get featured properties, sorted by creation date (newest first)
    const properties = await Property.find({
      is_featured: true,
      publish_status: 'published'
    })
      .populate('owner', 'first_name last_name email phone')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Property.countDocuments({
      is_featured: true,
      publish_status: 'published'
    });

    res.json({
      success: true,
      data: properties,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_properties: total,
        per_page: limit
      }
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

module.exports = router;
