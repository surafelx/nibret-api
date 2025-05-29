const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  first_name: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  last_name: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[0-9+\-\s()]+$/, 'Please enter a valid phone number']
  },
  preferences: {
    property_types: [{
      type: String,
      enum: ['house', 'apartment', 'condo', 'villa', 'townhouse', 'studio', 'other']
    }],
    min_price: {
      type: Number,
      min: [0, 'Minimum price cannot be negative']
    },
    max_price: {
      type: Number,
      min: [0, 'Maximum price cannot be negative']
    },
    min_beds: {
      type: Number,
      min: [0, 'Minimum bedrooms cannot be negative']
    },
    max_beds: {
      type: Number,
      min: [0, 'Maximum bedrooms cannot be negative']
    },
    preferred_locations: [{
      type: String,
      trim: true
    }]
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  source: {
    type: String,
    enum: ['website', 'referral', 'social_media', 'advertisement', 'walk_in', 'other'],
    default: 'website'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'potential', 'converted'],
    default: 'active'
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
customerSchema.index({ email: 1 });
customerSchema.index({ phone: 1 });
customerSchema.index({ status: 1 });
customerSchema.index({ created_at: -1 });

// Virtual for full name
customerSchema.virtual('full_name').get(function() {
  return `${this.first_name} ${this.last_name}`;
});

// Method to update preferences
customerSchema.methods.updatePreferences = function(preferences) {
  this.preferences = { ...this.preferences, ...preferences };
  return this.save();
};

module.exports = mongoose.model('Customer', customerSchema);
