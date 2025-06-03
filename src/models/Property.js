const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Property title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  beds: {
    type: Number,
    required: [true, 'Number of bedrooms is required'],
    min: [0, 'Bedrooms cannot be negative'],
    max: [20, 'Maximum 20 bedrooms allowed']
  },
  baths: {
    type: Number,
    required: [true, 'Number of bathrooms is required'],
    min: [0, 'Bathrooms cannot be negative'],
    max: [20, 'Maximum 20 bathrooms allowed']
  },
  sqft: {
    type: Number,
    required: [true, 'Square footage is required'],
    min: [1, 'Square footage must be at least 1']
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
    maxlength: [500, 'Address cannot exceed 500 characters']
  },
  lat: {
    type: Number,
    required: [true, 'Latitude is required'],
    min: [-90, 'Latitude must be between -90 and 90'],
    max: [90, 'Latitude must be between -90 and 90']
  },
  lng: {
    type: Number,
    required: [true, 'Longitude is required'],
    min: [-180, 'Longitude must be between -180 and 180'],
    max: [180, 'Longitude must be between -180 and 180']
  },
  propertyType: {
    type: String,
    required: [true, 'Property type is required'],
    enum: ['house', 'apartment', 'condo', 'villa', 'townhouse', 'studio', 'other'],
    lowercase: true
  },
  status: {
    type: String,
    enum: ['for_sale', 'for_rent', 'sold', 'rented', 'off_market'],
    default: 'for_sale',
    lowercase: true
  },
  publish_status: {
    type: String,
    enum: ['draft', 'published', 'archived', 'pending_review'],
    default: 'draft',
    lowercase: true
  },
  images: [{
    type: String,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Image must be a valid URL'
    }
  }],
  yearBuilt: {
    type: Number,
    min: [1800, 'Year built cannot be before 1800'],
    max: [new Date().getFullYear() + 5, 'Year built cannot be more than 5 years in the future']
  },
  lotSize: {
    type: Number,
    min: [0, 'Lot size cannot be negative']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Property owner is required']
  },
  features: [{
    type: String,
    trim: true
  }],
  is_featured: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  published_at: {
    type: Date
  },
  archived_at: {
    type: Date
  },
  listing_type: {
    type: String,
    enum: ['sale', 'rent', 'both'],
    default: 'sale',
    lowercase: true
  },
  contact_info: {
    phone: String,
    email: String,
    agent_name: String
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: {
    transform: function(doc, ret) {
      // Convert _id to id for frontend compatibility
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for better query performance
propertySchema.index({ status: 1 });
propertySchema.index({ propertyType: 1 });
propertySchema.index({ price: 1 });
propertySchema.index({ beds: 1 });
propertySchema.index({ baths: 1 });
propertySchema.index({ owner: 1 });
propertySchema.index({ lat: 1, lng: 1 }); // For geospatial queries
propertySchema.index({ created_at: -1 }); // For sorting by newest

// Text index for search functionality
propertySchema.index({
  title: 'text',
  description: 'text',
  address: 'text'
});

// Virtual for property age
propertySchema.virtual('age').get(function() {
  if (this.yearBuilt) {
    return new Date().getFullYear() - this.yearBuilt;
  }
  return null;
});

// Method to increment views
propertySchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Method to publish property
propertySchema.methods.publish = function() {
  this.publish_status = 'published';
  this.published_at = new Date();
  return this.save();
};

// Method to archive property
propertySchema.methods.archive = function() {
  this.publish_status = 'archived';
  this.archived_at = new Date();
  return this.save();
};

// Method to set as draft
propertySchema.methods.setAsDraft = function() {
  this.publish_status = 'draft';
  this.published_at = null;
  return this.save();
};

// Static method for search with filters
propertySchema.statics.searchProperties = function(filters) {
  const query = {};

  // Text search
  if (filters.search) {
    query.$text = { $search: filters.search };
  }

  // Property type filter
  if (filters.type && filters.type.length > 0) {
    query.propertyType = { $in: filters.type };
  }

  // Price range
  if (filters.min_price || filters.max_price) {
    query.price = {};
    if (filters.min_price) query.price.$gte = filters.min_price;
    if (filters.max_price) query.price.$lte = filters.max_price;
  }

  // Bedroom filter
  if (filters.bedroom) {
    query.beds = { $gte: filters.bedroom };
  }

  // Bathroom filter
  if (filters.bathroom) {
    query.baths = { $gte: filters.bathroom };
  }

  // Status filter
  if (filters.status) {
    query.status = filters.status;
  }

  return this.find(query).populate('owner', 'first_name last_name email phone');
};

// Static method for nearby properties
propertySchema.statics.findNearby = function(lat, lng, radius = 5) {
  // Convert radius from kilometers to radians
  const radiusInRadians = radius / 6371;

  return this.find({
    lat: {
      $gte: lat - radiusInRadians,
      $lte: lat + radiusInRadians
    },
    lng: {
      $gte: lng - radiusInRadians,
      $lte: lng + radiusInRadians
    }
  }).populate('owner', 'first_name last_name email phone');
};

module.exports = mongoose.model('Property', propertySchema);
