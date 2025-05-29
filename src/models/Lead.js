const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
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
  property: {
    type: String,
    required: [true, 'Property interest is required'],
    trim: true
  },
  property_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property'
  },
  message: {
    type: String,
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'lost', 'converted'],
    default: 'new'
  },
  source: {
    type: String,
    enum: ['website_form', 'phone_call', 'email', 'social_media', 'referral', 'other'],
    default: 'website_form'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  assigned_to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  follow_up_date: {
    type: Date
  },
  notes: [{
    content: {
      type: String,
      required: true,
      trim: true
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    created_at: {
      type: Date,
      default: Date.now
    }
  }],
  converted_to_customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
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
leadSchema.index({ status: 1 });
leadSchema.index({ priority: 1 });
leadSchema.index({ assigned_to: 1 });
leadSchema.index({ created_at: -1 });
leadSchema.index({ follow_up_date: 1 });

// Method to add note
leadSchema.methods.addNote = function(content, userId) {
  this.notes.push({
    content: content,
    created_by: userId
  });
  return this.save();
};

// Method to update status
leadSchema.methods.updateStatus = function(newStatus, userId) {
  const oldStatus = this.status;
  this.status = newStatus;
  
  // Add automatic note about status change
  this.notes.push({
    content: `Status changed from ${oldStatus} to ${newStatus}`,
    created_by: userId
  });
  
  return this.save();
};

// Static method to get leads by status
leadSchema.statics.getByStatus = function(status) {
  return this.find({ status })
    .populate('property_id', 'title address price')
    .populate('assigned_to', 'first_name last_name email')
    .sort({ created_at: -1 });
};

module.exports = mongoose.model('Lead', leadSchema);
